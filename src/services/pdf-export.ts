/**
 * PDF Export Service
 * Generates a PDF report of hearing test results
 */

import { jsPDF } from 'jspdf';
import { HearingProfile, classifyHearingLoss, getExpectedThresholds } from '../types';

/** Export options for customizing the PDF */
export interface ExportOptions {
  includeDisclaimer?: boolean;
  includeAgeComparison?: boolean;
}

/**
 * Generate a PDF report for a hearing profile
 * @param profile The hearing profile to export
 * @param audiogramDataUrl The audiogram canvas as a data URL
 * @param options Export customization options
 */
export async function exportToPDF(
  profile: HearingProfile,
  audiogramDataUrl: string,
  options: ExportOptions = {}
): Promise<void> {
  const { includeDisclaimer = true, includeAgeComparison = true } = options;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  
  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('YourEar Hearing Assessment', pageWidth / 2, y, { align: 'center' });
  y += 12;
  
  // Subtitle with date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  const dateStr = profile.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Test Date: ${dateStr}${profile.age ? ` · Age: ${profile.age} years` : ''}`, pageWidth / 2, y, { align: 'center' });
  y += 15;
  
  // Reset text color
  doc.setTextColor(0);
  
  // Audiogram image
  const imgWidth = contentWidth;
  const imgHeight = imgWidth * 0.67; // Maintain aspect ratio
  doc.addImage(audiogramDataUrl, 'PNG', margin, y, imgWidth, imgHeight);
  y += imgHeight + 10;
  
  // Summary section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, y);
  y += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Calculate PTA for each ear
  const ptaFreqs = [500, 1000, 2000];
  const calcPTA = (ear: 'rightEar' | 'leftEar') => {
    const values = ptaFreqs
      .map(f => profile.thresholds.find(t => t.frequency === f)?.[ear])
      .filter((v): v is number => v !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  
  const rightPTA = calcPTA('rightEar');
  const leftPTA = calcPTA('leftEar');
  
  if (rightPTA !== null) {
    const grade = classifyHearingLoss(rightPTA);
    doc.text(`Right Ear: ${rightPTA.toFixed(0)} dB HL (${formatGrade(grade)})`, margin, y);
    y += 6;
  }
  
  if (leftPTA !== null) {
    const grade = classifyHearingLoss(leftPTA);
    doc.text(`Left Ear: ${leftPTA.toFixed(0)} dB HL (${formatGrade(grade)})`, margin, y);
    y += 6;
  }
  
  // Age comparison
  if (includeAgeComparison && profile.age && (rightPTA !== null || leftPTA !== null)) {
    y += 4;
    const expected = getExpectedThresholds(profile.age);
    const expectedPTA = (expected[500].median + expected[1000].median + expected[2000].median) / 3;
    
    doc.text(`Expected PTA for age ${profile.age}: ~${expectedPTA.toFixed(0)} dB HL`, margin, y);
    y += 6;
    
    const avgPTA = ((rightPTA || 0) + (leftPTA || 0)) / (rightPTA && leftPTA ? 2 : 1);
    let comparison = '';
    if (avgPTA <= expectedPTA) {
      comparison = 'Your hearing is better than or equal to average for your age.';
    } else if (avgPTA <= expectedPTA + 10) {
      comparison = 'Your hearing is typical for your age.';
    } else {
      comparison = 'Your hearing shows more loss than typical for your age.';
    }
    doc.text(comparison, margin, y);
    y += 10;
  }
  
  // Thresholds table
  y += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Results', margin, y);
  y += 8;
  
  // Table header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const colWidths = [40, 45, 45];
  doc.text('Frequency', margin, y);
  doc.text('Right Ear (dB)', margin + colWidths[0], y);
  doc.text('Left Ear (dB)', margin + colWidths[0] + colWidths[1], y);
  y += 5;
  
  // Draw line under header
  doc.setDrawColor(200);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  profile.thresholds.forEach(t => {
    const freqStr = t.frequency >= 1000 ? `${t.frequency / 1000}k Hz` : `${t.frequency} Hz`;
    doc.text(freqStr, margin, y);
    doc.text(t.rightEar !== null ? String(t.rightEar) : '-', margin + colWidths[0], y);
    doc.text(t.leftEar !== null ? String(t.leftEar) : '-', margin + colWidths[0] + colWidths[1], y);
    y += 6;
  });
  
  // Disclaimer
  if (includeDisclaimer) {
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'italic');
    
    const disclaimer = 'DISCLAIMER: This is a self-assessment tool for curiosity and general awareness only. ' +
      'It is NOT a medical diagnosis. Results may vary based on equipment, environment, and other factors. ' +
      'Always consult a qualified audiologist for professional hearing evaluation and medical advice.';
    
    const lines = doc.splitTextToSize(disclaimer, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by YourEar · https://ismaelmartinez.github.io/yourear/', pageWidth / 2, 285, { align: 'center' });
  
  // Save the PDF
  const filename = `yourear-results-${profile.createdAt.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

function formatGrade(grade: string): string {
  const grades: Record<string, string> = {
    'normal': 'Normal',
    'slight': 'Slight loss',
    'mild': 'Mild loss',
    'moderate': 'Moderate loss',
    'moderately-severe': 'Moderately severe loss',
    'severe': 'Severe loss',
    'profound': 'Profound loss',
  };
  return grades[grade] || grade;
}

