import { Injectable, inject, NgZone } from '@angular/core';
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
  private zone = inject(NgZone);

  // socket state (lazy)
  private socket: any | null = null;
  private messageNew$ = new Subject<MessageDto>();
  private joinedRooms = new Set<number>();

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

  // REST: delete conversation
  deleteConversation(conversationId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiBase}/conversations/${conversationId}`,
      { headers: this.authHeaders() }
    );
  }

  // REST: unread count
  getUnreadTotal(): Observable<{ success: boolean; count: number }> {
    return this.http.get<{ success: boolean; count: number }>(
      `${this.apiBase}/messages/unread/count`,
      { headers: this.authHeaders() }
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
      const token = localStorage.getItem('adomi_access_token') || '';
      this.socket = io(this.apiBase, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        auth: { token }
      });
      this.socket.on('connect_error', (err: any) => {
        console.error('[CHAT SOCKET] connect_error:', err?.message || err);
      });
      this.socket.on('error', (err: any) => {
        console.error('[CHAT SOCKET] error:', err);
      });
      this.socket.on('disconnect', (reason: any) => {
        console.warn('[CHAT SOCKET] disconnected:', reason);
      });
      this.socket.on('connect', () => {
        try { console.log('[CHAT SOCKET] connected:', this.socket?.id); } catch {}
        // Re-join previously joined rooms on reconnect
        try {
          this.joinedRooms.forEach((convId) => {
            console.log('[CHAT SOCKET] rejoin:conversation', convId);
            this.socket?.emit('join:conversation', convId);
          });
        } catch {}
      });
      this.socket.on('reconnect', () => {
        try {
          console.log('[CHAT SOCKET] reconnected, rejoining rooms');
          this.joinedRooms.forEach((convId) => this.socket?.emit('join:conversation', convId));
        } catch {}
      });
      this.socket.on('message:new', (msg: MessageDto) => {
        console.log('[CHAT SOCKET] message:new', msg);
        // Asegurar ejecución dentro de Angular para disparar Change Detection
        this.zone.run(() => this.messageNew$.next(msg));
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
    try {
      console.log('[CHAT SOCKET] join:conversation', conversationId);
      this.socket?.emit('join:conversation', conversationId);
      this.joinedRooms.add(conversationId);
    } catch {}
  }

  onMessageNew(): Observable<MessageDto> {
    return this.messageNew$.asObservable();
  }
}


