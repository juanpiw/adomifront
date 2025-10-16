import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConversationDto {
  id: number;
  client_id: number;
  provider_id: number;
  last_message_id?: number | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface MessageDto {
  id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  read_at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private apiBase = environment.apiBaseUrl;

  // socket state (lazy)
  private socket: any | null = null;
  private messageNew$ = new Subject<MessageDto>();

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('adomi_access_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // REST: conversations
  createOrGetConversation(clientId: number, providerId: number): Observable<{ success: boolean; conversation: ConversationDto }> {
    return this.http.post<{ success: boolean; conversation: ConversationDto }>(
      `${this.apiBase}/conversations`,
      { client_id: clientId, provider_id: providerId },
      { headers: this.authHeaders() }
    );
  }

  listConversations(userId: number): Observable<{ success: boolean; conversations: ConversationDto[] }> {
    return this.http.get<{ success: boolean; conversations: ConversationDto[] }>(
      `${this.apiBase}/conversations/user/${userId}`,
      { headers: this.authHeaders() }
    );
  }

  // REST: messages
  listMessages(conversationId: number, opts?: { limit?: number; before?: string }): Observable<{ success: boolean; messages: MessageDto[] }> {
    let params = new HttpParams();
    if (opts?.limit) params = params.set('limit', String(opts.limit));
    if (opts?.before) params = params.set('before', opts.before);
    return this.http.get<{ success: boolean; messages: MessageDto[] }>(
      `${this.apiBase}/conversations/${conversationId}/messages`,
      { headers: this.authHeaders(), params }
    );
  }

  sendMessage(conversationId: number, receiverId: number, content: string): Observable<{ success: boolean; message: MessageDto }> {
    return this.http.post<{ success: boolean; message: MessageDto }>(
      `${this.apiBase}/messages`,
      { conversation_id: conversationId, receiver_id: receiverId, content },
      { headers: this.authHeaders() }
    );
  }

  markRead(messageId: number): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(
      `${this.apiBase}/messages/${messageId}/read`,
      {},
      { headers: this.authHeaders() }
    );
  }

  // SOCKET: connect lazily (requires socket.io-client at runtime)
  async connectSocket(): Promise<void> {
    if (this.socket) return;
    try {
      const mod: any = await import('socket.io-client');
      const io = mod.io || mod.default?.io || mod.default;
      this.socket = io(this.apiBase, { path: '/socket.io', transports: ['websocket'] });
      this.socket.on('connect', () => {});
      this.socket.on('message:new', (msg: MessageDto) => {
        this.messageNew$.next(msg);
      });
    } catch {
      // socket not available; ignore (REST seguirá funcionando)
    }
  }

  disconnectSocket(): void {
    try {
      this.socket?.disconnect();
    } catch {}
    this.socket = null;
  }

  async joinConversation(conversationId: number): Promise<void> {
    if (!this.socket) await this.connectSocket();
    try { this.socket?.emit('join', { conversationId }); } catch {}
  }

  onMessageNew(): Observable<MessageDto> {
    return this.messageNew$.asObservable();
  }
}


