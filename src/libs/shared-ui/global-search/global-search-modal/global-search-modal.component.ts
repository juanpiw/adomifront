import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SearchSuggestion } from '../models/search-suggestion.model';
import { GlobalSearchService } from '../services/global-search.service';
import { SearchSuggestionItemComponent } from '../search-suggestion-item/search-suggestion-item.component';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'ui-global-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchSuggestionItemComponent, IconComponent],
  templateUrl: './global-search-modal.component.html',
  styleUrls: ['./global-search-modal.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('in', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      state('out', style({
        opacity: 0,
        transform: 'scale(0.95)'
      })),
      transition('in => out', animate('200ms ease-in')),
      transition('out => in', animate('200ms ease-out'))
    ])
  ]
})
export class GlobalSearchModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() suggestionClick = new EventEmitter<SearchSuggestion>();
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchQuery: string = '';
  searchResults: SearchSuggestion[] = [];
  isLoading: boolean = false;
  defaultSuggestions: SearchSuggestion[] = [];
  recentSearches: string[] = [];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private globalSearchService: GlobalSearchService) {}

  ngOnInit(): void {
    this.loadDefaultSuggestions();
    this.loadRecentSearches();
    this.setupSearchSubscription();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.focusSearchInput();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDefaultSuggestions(): void {
    this.defaultSuggestions = this.globalSearchService.getDefaultSuggestions();
  }

  private loadRecentSearches(): void {
    this.recentSearches = this.globalSearchService.getRecentSearches();
  }

  private setupSearchSubscription(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        if (query.trim()) {
          this.performSearch(query);
        } else {
          this.searchResults = [];
        }
      });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchSubject.next(this.searchQuery);
  }

  private performSearch(query: string): void {
    this.isLoading = true;
    this.globalSearchService.search(query)
      .subscribe({
        next: (result) => {
          this.searchResults = result.suggestions;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error en búsqueda:', error);
          this.isLoading = false;
        }
      });
  }

  onSuggestionClick(suggestion: SearchSuggestion): void {
    this.suggestionClick.emit(suggestion);
    this.closeModal();
  }

  onRecentSearchClick(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
    this.focusSearchInput();
  }

  clearRecentSearches(): void {
    this.globalSearchService.clearRecentSearches();
    this.loadRecentSearches();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.close.emit();
  }

  // Método para enfocar el input cuando se abre el modal
  focusSearchInput(): void {
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
  }

  // Manejar teclas especiales
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }
}
