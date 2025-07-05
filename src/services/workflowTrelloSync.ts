/**
 * Secure Trello Integration for Workflow-Bolt
 * Syncs patient workflows directly via API (no Power-Up needed)
 */

import { trelloApi } from './trelloApi';
import type { Patient } from '../types';

interface WorkflowBoard {
  id: string;
  name: string;
  lists: {
    scheduled: string;
    checkedIn: string;
    withDoctor: string;
    completed: string;
  };
}

class WorkflowTrelloSync {
  private boardCache: Map<string, WorkflowBoard> = new Map();

  /**
   * Create a daily workflow board for patient management
   */
  async createDailyWorkflowBoard(date: string): Promise<WorkflowBoard> {
    const boardName = `Patient Flow - ${date}`;
    
    // Create board
    const board = await trelloApi.createBoard(
      boardName,
      `Daily patient workflow tracking for ${date}`
    );

    // Create workflow lists
    const scheduledList = await trelloApi.createList(board.id, '📅 Scheduled', 'top');
    const checkedInList = await trelloApi.createList(board.id, '✅ Checked In', 'bottom');
    const withDoctorList = await trelloApi.createList(board.id, '👨‍⚕️ With Doctor', 'bottom');
    const completedList = await trelloApi.createList(board.id, '✅ Completed', 'bottom');

    const workflowBoard: WorkflowBoard = {
      id: board.id,
      name: boardName,
      lists: {
        scheduled: scheduledList.id,
        checkedIn: checkedInList.id,
        withDoctor: withDoctorList.id,
        completed: completedList.id
      }
    };

    this.boardCache.set(date, workflowBoard);
    return workflowBoard;
  }

  /**
   * Sync patient to Trello card
   */
  async syncPatientToTrello(patient: Patient, date: string): Promise<void> {
    let board = this.boardCache.get(date);
    if (!board) {
      board = await this.createDailyWorkflowBoard(date);
    }

    const listId = this.getListIdForStatus(patient.status, board);
    const cardName = `${patient.name} - ${patient.appointmentTime}`;
    const cardDescription = this.formatPatientCard(patient);

    try {
      // Check if card already exists
      const existingCards = await trelloApi.getCards(listId);
      const existingCard = existingCards.find(card => 
        card.name.includes(patient.name)
      );

      if (existingCard) {
        // Update existing card
        await trelloApi.updateCard(existingCard.id, {
          name: cardName,
          desc: cardDescription
        });

        // Move to correct list if status changed
        const correctListId = this.getListIdForStatus(patient.status, board);
        if (existingCard.listId !== correctListId) {
          await trelloApi.moveCard(existingCard.id, correctListId);
        }
      } else {
        // Create new card
        await trelloApi.createCard(listId, cardName, cardDescription);
      }
    } catch (error) {
      console.error(`Failed to sync patient ${patient.name} to Trello:`, error);
    }
  }

  /**
   * Sync multiple patients
   */
  async syncPatientsToTrello(patients: Patient[], date: string): Promise<void> {
    console.log(`Syncing ${patients.length} patients to Trello for ${date}`);
    
    for (const patient of patients) {
      await this.syncPatientToTrello(patient, date);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Patient sync to Trello completed');
  }

  /**
   * Get appropriate list ID based on patient status
   */
  private getListIdForStatus(status: string, board: WorkflowBoard): string {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return board.lists.scheduled;
      
      case 'arrived':
      case 'checked-in':
      case 'waiting':
        return board.lists.checkedIn;
      
      case 'with-doctor':
      case 'in-exam':
        return board.lists.withDoctor;
      
      case 'completed':
      case 'checked-out':
        return board.lists.completed;
      
      default:
        return board.lists.scheduled;
    }
  }

  /**
   * Format patient data for Trello card description
   */
  private formatPatientCard(patient: Patient): string {
    return `
**Patient Information:**
- Name: ${patient.name}
- Appointment: ${patient.appointmentTime}
- Type: ${patient.appointmentType || 'Standard'}
- Status: ${patient.status}

**Clinical Notes:**
${patient.chiefComplaint || 'No chief complaint recorded'}

**Workflow Tracking:**
- Check-in: ${patient.checkInTime || 'Not checked in'}
- Room: ${patient.room || 'Not assigned'}

*Updated: ${new Date().toLocaleString()}*
    `.trim();
  }

  /**
   * Get board for date (creates if doesn't exist)
   */
  async getBoardForDate(date: string): Promise<WorkflowBoard> {
    let board = this.boardCache.get(date);
    if (!board) {
      // Try to find existing board
      const boards = await trelloApi.getBoards();
      const existingBoard = boards.find(b => b.name.includes(date));
      
      if (existingBoard) {
        // Reconstruct board structure from existing board
        const lists = await trelloApi.getLists(existingBoard.id);
        board = {
          id: existingBoard.id,
          name: existingBoard.name,
          lists: {
            scheduled: lists.find(l => l.name.includes('Scheduled'))?.id || '',
            checkedIn: lists.find(l => l.name.includes('Checked In'))?.id || '',
            withDoctor: lists.find(l => l.name.includes('Doctor'))?.id || '',
            completed: lists.find(l => l.name.includes('Completed'))?.id || ''
          }
        };
        this.boardCache.set(date, board);
      } else {
        board = await this.createDailyWorkflowBoard(date);
      }
    }
    return board;
  }
}

// Export singleton
export const workflowTrelloSync = new WorkflowTrelloSync();
export default workflowTrelloSync;