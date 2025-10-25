import { Patient } from '../database/migrations/v1/schema_v1';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getPatient } from './PatientService';
import { pdfStyles } from '../common/pdfStyles';
import { getPatientConditionsByPatientId } from './PatientConditionService';
import { getPatientAllergiesByPatientId } from './PatientAllergyService';
import { getPatientMedicationsByPatientId } from './PatientMedicationService';
import { getPatientGoalsByPatientId } from './PatientGoalService';
import { getPatientEmergencyCaresByPatientId } from './PatientEmergencyCareService';
import { getPatientEquipmentsByPatientId } from './PatientEquipmentService';
import { getHospitalizationsByPatientId } from './HospitalizationService';
import { getSurgeryProceduresByPatientId } from './SurgeryProcedureService';
import { getDischargeInstructionsByPatientId } from './DischargeInstructionService';
import { getPatientNotesByPatientId } from './PatientNoteService';
import { getAllContactsByPatientId } from './ContactService';

export class PDFExportService {
  /**
   * Generate HTML content for comprehensive patient health data
   * @param patient Patient data to include in the PDF
   * @param healthData All health-related data for the patient
   * @returns HTML string for the PDF
   */
  private static generatePatientHTML(patient: Patient, healthData: any): string {
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Patient Data Export</title>
          <style>
            ${pdfStyles}
          </style>
        </head>
        <body>
          <div class="document-container">
            <div class="header">
              <div class="logo">CareMap Health Report</div>
              <div class="subtitle">Comprehensive Patient Health Summary</div>
              <div class="date">Generated on: ${currentDate}</div>
            </div>
            
            <div class="patient-summary">
              <h2 style="margin-top: 0; border: none; color: #2980b9; font-size: 16px; margin-bottom: 12px;">👤 Patient Overview</h2>
              <div class="info-grid">
                <div class="info-row">
                  <div class="info-label">👤 Full Name</div>
                  <div class="info-value highlight">${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">📅 Date of Birth</div>
                  <div class="info-value">${patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '<em>Not provided</em>'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">⚥ Gender</div>
                  <div class="info-value">${patient.gender || '<em>Not specified</em>'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">👥 Relationship</div>
                  <div class="info-value">${patient.relationship || 'Self'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">🩸 Blood Type</div>
                  <div class="info-value ${patient.blood_type ? 'highlight' : ''}">${patient.blood_type || '<em>Not provided</em>'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">📏 Height</div>
                  <div class="info-value">${patient.height ? `${patient.height} ${patient.height_unit || ''}` : '<em>Not provided</em>'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">⚖️ Weight</div>
                  <div class="info-value">${patient.weight ? `${patient.weight} ${patient.weight_unit || ''}` : '<em>Not provided</em>'}</div>
                </div>
              </div>
            </div>
          
          ${this.generateConditionsSection(healthData.conditions)}
          ${this.generateAllergiesSection(healthData.allergies)}
          ${this.generateMedicationsSection(healthData.medications)}
          ${this.generateGoalsSection(healthData.goals)}
          ${this.generateEmergencyCareSection(healthData.emergencyCare)}
          ${this.generateEquipmentSection(healthData.equipment)}
          ${this.generateHospitalizationsSection(healthData.hospitalizations)}
          ${this.generateSurgeryProceduresSection(healthData.surgeryProcedures)}
          ${this.generateDischargeInstructionsSection(healthData.dischargeInstructions)}
          ${this.generateNotesSection(healthData.notes)}
          ${this.generateContactsSection(healthData.contacts)}
          
            <div class="footer">
              <div class="footer-warning">⚠️ CONFIDENTIAL MEDICAL INFORMATION</div>
              <div>This document contains protected health information (PHI) and must be handled in accordance with HIPAA regulations and applicable privacy laws. Unauthorized disclosure is prohibited.</div>
              <div style="margin-top: 10px; font-size: 11px;">Generated by CareMap Health System • Report ID: ${Date.now()}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Export comprehensive patient health data to PDF
   * @param patientId ID of the patient to export
   * @returns Promise resolving to success status
   */
  public static async exportPatientDataToPDF(patientId: number): Promise<boolean> {
    try {
      // Get patient data
      const patient = await getPatient(patientId);
      
      if (!patient) {
        console.error('Patient not found');
        return false;
      }

      // Gather all health data
      const [conditions, allergies, medications, goals, emergencyCare, equipment, 
             hospitalizations, surgeryProcedures, dischargeInstructions, notes, 
             contacts] = await Promise.all([
        getPatientConditionsByPatientId(patientId),
        getPatientAllergiesByPatientId(patientId),
        getPatientMedicationsByPatientId(patientId),
        getPatientGoalsByPatientId(patientId),
        getPatientEmergencyCaresByPatientId(patientId),
        getPatientEquipmentsByPatientId(patientId),
        getHospitalizationsByPatientId(patientId),
        getSurgeryProceduresByPatientId(patientId),
        getDischargeInstructionsByPatientId(patientId),
        getPatientNotesByPatientId(patientId),
        getAllContactsByPatientId(patientId)
      ]);

      const healthData = {
        conditions,
        allergies,
        medications,
        goals,
        emergencyCare,
        equipment,
        hospitalizations,
        surgeryProcedures,
        dischargeInstructions,
        notes,
        contacts
      };
      
      // Generate HTML with comprehensive health data
      const html = this.generatePatientHTML(patient, healthData);
      
      // Create PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      
      // Create a new file path with the desired name
      const newFilePath = `${uri.slice(0, uri.lastIndexOf('/') + 1)}${patient.first_name}_${patient.last_name}_Health_Report.pdf`;
      
      // Rename the file
      await FileSystem.moveAsync({
        from: uri,
        to: newFilePath
      });
      
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        // Share the PDF with the new file path
        await Sharing.shareAsync(newFilePath, {
          mimeType: 'application/pdf',
          dialogTitle: `${patient.first_name} ${patient.last_name} - Comprehensive Health Report`,
          UTI: 'com.adobe.pdf'
        });
        return true;
      } else {
        console.error('Sharing is not available on this device');
        return false;
      }
    } catch (error) {
      console.error('Error exporting patient data to PDF:', error);
      return false;
    }
  }

  /**
   * Generate conditions section with tabular data
   */
  private static generateConditionsSection(conditions: any[]): string {
    if (!conditions || conditions.length === 0) {
      return `
        <div class="section">
          <h2>Medical Conditions</h2>
          <div class="no-data">No medical conditions recorded</div>
        </div>
      `;
    }

    const rows = conditions.map(condition => `
      <tr>
        <td><strong>${condition.condition_name}</strong></td>
        <td><span class="status-badge ${condition.linked_health_system ? 'status-yes' : 'status-no'}">${condition.linked_health_system ? 'Yes' : 'No'}</span></td>
        <td>${new Date(condition.created_date).toLocaleDateString()}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>Medical Conditions</h2>
        <table class="health-table">
          <thead>
            <tr>
              <th>Condition Name</th>
              <th>Linked to Health System</th>
              <th>Date Added</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate allergies section with tabular data
   */
  private static generateAllergiesSection(allergies: any[]): string {
    if (!allergies || allergies.length === 0) {
      return `
        <div class="section">
          <h2>Allergies</h2>
          <div class="no-data">No allergies recorded</div>
        </div>
      `;
    }

    const rows = allergies.map(allergy => {
      const severityClass = allergy.severity ? `severity-${allergy.severity.toLowerCase()}` : '';
      return `
        <tr>
          <td><strong>${allergy.topic}</strong></td>
          <td>${allergy.details || '<em>No details provided</em>'}</td>
          <td><span class="status-badge ${severityClass}">${allergy.severity || 'Not specified'}</span></td>
          <td>${new Date(allergy.onset_date).toLocaleDateString()}</td>
          <td><span class="status-badge ${allergy.linked_health_system ? 'status-yes' : 'status-no'}">${allergy.linked_health_system ? 'Yes' : 'No'}</span></td>
        </tr>
      `;
    }).join('');

    return `
      <div class="section">
        <h2>Allergies</h2>
        <table class="health-table">
          <thead>
            <tr>
              <th>Allergy</th>
              <th>Details</th>
              <th>Severity</th>
              <th>Onset Date</th>
              <th>Linked to Health System</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate medications section with tabular data
   */
  private static generateMedicationsSection(medications: any[]): string {
    if (!medications || medications.length === 0) {
      return `
        <div class="section">
          <h2>Current Medications</h2>
          <div class="no-data">No medications recorded</div>
        </div>
      `;
    }

    const rows = medications.map(medication => `
      <tr>
        <td><strong>${medication.name}</strong></td>
        <td>${medication.details}</td>
        <td><span class="status-badge ${medication.linked_health_system ? 'status-yes' : 'status-no'}">${medication.linked_health_system ? 'Yes' : 'No'}</span></td>
        <td>${new Date(medication.created_date).toLocaleDateString()}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>Current Medications</h2>
        <table class="health-table">
          <thead>
            <tr>
              <th>Medication Name</th>
              <th>Details/Dosage</th>
              <th>Linked to Health System</th>
              <th>Date Added</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate goals section with tabular data
   */
  private static generateGoalsSection(goals: any[]): string {
    if (!goals || goals.length === 0) {
      return `
        <div class="section">
          <h2>Health Goals</h2>
          <div class="no-data">No health goals recorded</div>
        </div>
      `;
    }

    const rows = goals.map(goal => `
      <tr>
        <td>${goal.goal_description}</td>
        <td>${goal.target_date ? new Date(goal.target_date).toLocaleDateString() : '<em>No target date</em>'}</td>
        <td><span class="status-badge ${goal.linked_health_system ? 'status-yes' : 'status-no'}">${goal.linked_health_system ? 'Yes' : 'No'}</span></td>
        <td>${new Date(goal.created_date).toLocaleDateString()}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>Health Goals</h2>
        <table class="health-table">
          <thead>
            <tr>
              <th>Goal Description</th>
              <th>Target Date</th>
              <th>Linked to Health System</th>
              <th>Date Created</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate emergency care section with tabular data
   */
  private static generateEmergencyCareSection(emergencyCare: any[]): string {
    if (!emergencyCare || emergencyCare.length === 0) {
      return `
        <div class="section">
          <h2>Emergency Care Information</h2>
          <div class="no-data">No emergency care information recorded</div>
        </div>
      `;
    }

    const rows = emergencyCare.map(care => `
      <tr>
        <td><strong>${care.topic}</strong></td>
        <td>${care.details || '<em>No details provided</em>'}</td>
        <td><span class="status-badge ${care.linked_health_system ? 'status-yes' : 'status-no'}">${care.linked_health_system ? 'Yes' : 'No'}</span></td>
        <td>${new Date(care.created_date).toLocaleDateString()}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>Emergency Care Information</h2>
        <table class="health-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Details</th>
              <th>Linked to Health System</th>
              <th>Date Added</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate equipment section with tabular data
   */
  private static generateEquipmentSection(equipment: any[]): string {
    if (!equipment || equipment.length === 0) {
      return `
        <div class="section">
          <h2>Medical Equipment</h2>
          <div class="no-data">No medical equipment recorded</div>
        </div>
      `;
    }

    const rows = equipment.map(equip => `
      <tr>
        <td><strong>${equip.equipment_name}</strong></td>
        <td>${equip.equipment_description || '<em>No description provided</em>'}</td>
        <td><span class="status-badge ${equip.linked_health_system ? 'status-yes' : 'status-no'}">${equip.linked_health_system ? 'Yes' : 'No'}</span></td>
        <td>${new Date(equip.created_date).toLocaleDateString()}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>Medical Equipment</h2>
        <table class="health-table">
          <thead>
            <tr>
              <th>Equipment Name</th>
              <th>Description</th>
              <th>Linked to Health System</th>
              <th>Date Added</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate hospitalizations section with tabular data
   */
  private static generateHospitalizationsSection(hospitalizations: any[]): string {
    if (!hospitalizations || hospitalizations.length === 0) {
      return `
        <div class="section">
          <h2>Hospitalizations</h2>
          <div class="no-data">No hospitalizations recorded</div>
        </div>
      `;
    }

    const rows = hospitalizations.map(hosp => `
      <tr>
        <td>${new Date(hosp.admission_date).toLocaleDateString()}</td>
        <td>${new Date(hosp.discharge_date).toLocaleDateString()}</td>
        <td>${hosp.details || '<em>No details provided</em>'}</td>
        <td><span class="status-badge ${hosp.linked_health_system ? 'status-yes' : 'status-no'}">${hosp.linked_health_system ? 'Yes' : 'No'}</span></td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>Hospitalizations</h2>
        <table class="health-table">
          <thead>
            <tr>
              <th>Admission Date</th>
              <th>Discharge Date</th>
              <th>Details</th>
              <th>Linked to Health System</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate surgery procedures section with tabular data
   */
  private static generateSurgeryProceduresSection(surgeryProcedures: any[]): string {
    if (!surgeryProcedures || surgeryProcedures.length === 0) {
      return `
        <div class="section">
          <h2>Surgery Procedures</h2>
          <div class="no-data">No surgery procedures recorded</div>
        </div>
      `;
    }

    const rows = surgeryProcedures.map(surgery => `
      <tr>
        <td><strong>${surgery.procedure_name}</strong></td>
        <td>${new Date(surgery.procedure_date).toLocaleDateString()}</td>
        <td>${surgery.surgeon_name || '<em>Not specified</em>'}</td>
        <td>${surgery.facility || '<em>Not specified</em>'}</td>
        <td>${surgery.complications || '<span style="color: #27ae60;">None reported</span>'}</td>
        <td>${surgery.details || '<em>No details provided</em>'}</td>
        <td><span class="status-badge ${surgery.linked_health_system ? 'status-yes' : 'status-no'}">${surgery.linked_health_system ? 'Yes' : 'No'}</span></td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>Surgery Procedures</h2>
        <table class="health-table">
          <thead>
            <tr>
              <th>Procedure Name</th>
              <th>Date</th>
              <th>Surgeon</th>
              <th>Facility</th>
              <th>Complications</th>
              <th>Details</th>
              <th>Linked to Health System</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate discharge instructions section with tabular data
   */
  private static generateDischargeInstructionsSection(dischargeInstructions: any[]): string {
    if (!dischargeInstructions || dischargeInstructions.length === 0) {
      return `
        <div class="section">
          <h2>Discharge Instructions</h2>
          <div class="no-data">No discharge instructions recorded</div>
        </div>
      `;
    }

    const rows = dischargeInstructions.map(instruction => `
      <tr>
        <td>${new Date(instruction.discharge_date).toLocaleDateString()}</td>
        <td><strong>${instruction.summary}</strong></td>
        <td>${instruction.details || '<em>No additional details</em>'}</td>
        <td><span class="status-badge ${instruction.linked_health_system ? 'status-yes' : 'status-no'}">${instruction.linked_health_system ? 'Yes' : 'No'}</span></td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>Discharge Instructions</h2>
        <table class="health-table">
          <thead>
            <tr>
              <th>Discharge Date</th>
              <th>Summary</th>
              <th>Details</th>
              <th>Linked to Health System</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate notes section with tabular data
   */
  private static generateNotesSection(notes: any[]): string {
    if (!notes || notes.length === 0) {
      return `
        <div class="section">
          <h2>Patient Notes</h2>
          <div class="no-data">No patient notes recorded</div>
        </div>
      `;
    }

    const rows = notes.map(note => `
      <tr>
        <td><strong>${note.topic}</strong></td>
        <td>${note.details || '<em>No details provided</em>'}</td>
        <td>${note.reminder_date ? new Date(note.reminder_date).toLocaleDateString() : '<em>No reminder set</em>'}</td>
        <td>${new Date(note.created_date).toLocaleDateString()}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>Patient Notes</h2>
        <table class="health-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Details</th>
              <th>Reminder Date</th>
              <th>Date Created</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }


  /**
   * Generate contacts section with tabular data
   */
  private static generateContactsSection(contacts: any[]): string {
    if (!contacts || contacts.length === 0) {
      return `
        <div class="section">
          <h2>Emergency Contacts</h2>
          <div class="no-data">No emergency contacts recorded</div>
        </div>
      `;
    }

    const rows = contacts.map(contact => `
      <tr>
        <td><strong>${contact.first_name} ${contact.last_name || ''}</strong></td>
        <td>${contact.relationship || '<em>Not specified</em>'}</td>
        <td><a href="tel:${contact.phone_number}" style="color: #3498db; text-decoration: none;">${contact.phone_number}</a></td>
        <td>${contact.email ? `<a href="mailto:${contact.email}" style="color: #3498db; text-decoration: none;">${contact.email}</a>` : '<em>No email provided</em>'}</td>
        <td>${contact.description || '<em>No description</em>'}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>Emergency Contacts</h2>
        <table class="health-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Relationship</th>
              <th>Phone Number</th>
              <th>Email</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }
}