/**
 * Trello API Integration for Project Management
 * Handles boards, lists, cards, and workflow automation
 */

interface TrelloConfig {
  apiKey: string;
  token: string;
  baseUrl: string;
}

interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  url: string;
  lists?: TrelloList[];
}

interface TrelloList {
  id: string;
  name: string;
  pos: number;
  boardId: string;
  cards?: TrelloCard[];
}

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  listId: string;
  pos: number;
  due?: string;
  labels: TrelloLabel[];
  members: TrelloMember[];
  url: string;
}

interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string;
}

class TrelloApiService {
  private config: TrelloConfig;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_TRELLO_API_KEY || '',
      token: import.meta.env.VITE_TRELLO_TOKEN || '',
      baseUrl: 'https://api.trello.com/1'
    };
  }

  /**
   * Build API URL with authentication
   */
  private buildUrl(endpoint: string, params: Record<string, string> = {}): string {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    url.searchParams.set('key', this.config.apiKey);
    url.searchParams.set('token', this.config.token);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.toString();
  }

  /**
   * Generic API request handler
   */
  private async apiRequest<T>(
    endpoint: string, 
    options: RequestInit & { params?: Record<string, string> } = {}
  ): Promise<T> {
    const { params = {}, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers
        }
      });

      if (!response.ok) {
        throw new Error(`Trello API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Trello API request failed:', error);
      throw error;
    }
  }

  /**
   * Test API connection and get user info
   */
  async testConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const user = await this.apiRequest('/members/me');
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get all boards for the authenticated user
   */
  async getBoards(): Promise<TrelloBoard[]> {
    return this.apiRequest<TrelloBoard[]>('/members/me/boards');
  }

  /**
   * Get a specific board with lists and cards
   */
  async getBoard(boardId: string): Promise<TrelloBoard> {
    const board = await this.apiRequest<TrelloBoard>(`/boards/${boardId}`, {
      params: { lists: 'open', cards: 'open' }
    });
    
    // Get lists with cards
    const lists = await this.getLists(boardId);
    board.lists = lists;
    
    return board;
  }

  /**
   * Get lists for a board
   */
  async getLists(boardId: string): Promise<TrelloList[]> {
    const lists = await this.apiRequest<TrelloList[]>(`/boards/${boardId}/lists`);
    
    // Get cards for each list
    for (const list of lists) {
      list.cards = await this.getCards(list.id);
    }
    
    return lists;
  }

  /**
   * Get cards for a list
   */
  async getCards(listId: string): Promise<TrelloCard[]> {
    return this.apiRequest<TrelloCard[]>(`/lists/${listId}/cards`);
  }

  /**
   * Create a new board
   */
  async createBoard(name: string, desc = ''): Promise<TrelloBoard> {
    return this.apiRequest<TrelloBoard>('/boards', {
      method: 'POST',
      body: JSON.stringify({ name, desc })
    });
  }

  /**
   * Create a new list on a board
   */
  async createList(boardId: string, name: string, pos = 'bottom'): Promise<TrelloList> {
    return this.apiRequest<TrelloList>('/lists', {
      method: 'POST',
      body: JSON.stringify({ name, idBoard: boardId, pos })
    });
  }

  /**
   * Create a new card in a list
   */
  async createCard(
    listId: string, 
    name: string, 
    desc = '', 
    due?: string,
    pos = 'bottom'
  ): Promise<TrelloCard> {
    const cardData: any = { name, desc, idList: listId, pos };
    if (due) cardData.due = due;
    
    return this.apiRequest<TrelloCard>('/cards', {
      method: 'POST',
      body: JSON.stringify(cardData)
    });
  }

  /**
   * Update a card
   */
  async updateCard(
    cardId: string, 
    updates: Partial<{
      name: string;
      desc: string;
      due: string;
      idList: string;
      pos: string | number;
    }>
  ): Promise<TrelloCard> {
    return this.apiRequest<TrelloCard>(`/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Move card to different list
   */
  async moveCard(cardId: string, listId: string, pos = 'bottom'): Promise<TrelloCard> {
    return this.updateCard(cardId, { idList: listId, pos });
  }

  /**
   * Add comment to card
   */
  async addComment(cardId: string, text: string): Promise<any> {
    return this.apiRequest(`/cards/${cardId}/actions/comments`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  /**
   * Get webhooks for monitoring changes
   */
  async getWebhooks(): Promise<any[]> {
    return this.apiRequest('/members/me/tokens');
  }

  /**
   * Create webhook for board changes
   */
  async createWebhook(boardId: string, callbackUrl: string): Promise<any> {
    return this.apiRequest('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Workflow-Bolt Integration',
        callbackURL: callbackUrl,
        idModel: boardId
      })
    });
  }
}

// Export singleton instance
export const trelloApi = new TrelloApiService();
export default trelloApi;

// Export types
export type {
  TrelloBoard,
  TrelloList,
  TrelloCard,
  TrelloLabel,
  TrelloMember
};