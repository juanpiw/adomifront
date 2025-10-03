﻿import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  email = '';
  modalEmail = '';
  showModal = false;
  faqOpen: boolean[] = [false, false, false];

  ngOnInit() {
    this.initAnimations();
    this.initScrollAnimations();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  // Form submission handlers
  onSubmit(event: Event) {
    event.preventDefault();
    console.log('Form submitted with email:', this.email);
    // Here you would typically send the email to your backend
    alert('¡Gracias por tu interés! Te contactaremos pronto.');
    this.email = '';
  }

  onModalSubmit(event: Event) {
    event.preventDefault();
    console.log('Modal form submitted with email:', this.modalEmail);
    // Here you would typically send the email to your backend
    alert('¡Bienvenido a los Fundadores! Te contactaremos pronto.');
    this.modalEmail = '';
    this.closeModal();
  }

  // Modal handlers
  openModal() {
    this.showModal = true;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    this.showModal = false;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'auto';
    }
  }

  // FAQ handlers
  toggleFaq(index: number) {
    this.faqOpen[index] = !this.faqOpen[index];
  }

  // Animation initialization
  private initAnimations() {
    // Check if we're in browser environment
    if (typeof document !== 'undefined') {
      // Smooth scrolling for navigation links
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.matches('a[href^="#"]')) {
          e.preventDefault();
          const targetId = target.getAttribute('href')?.substring(1);
          if (targetId) {
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
              targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }
        }
      });
    }
  }

  private initScrollAnimations() {
    // Check if we're in browser environment
    if (typeof document !== 'undefined' && typeof IntersectionObserver !== 'undefined') {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      }, observerOptions);

      // Observe elements with animation classes
      setTimeout(() => {
        const animatedElements = document.querySelectorAll('.fade-in-up, .animate-fade-in-up');
        animatedElements.forEach(el => observer.observe(el));
      }, 100);
    }
  }
}
