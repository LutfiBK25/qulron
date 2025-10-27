import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';

@Component({
  selector: 'app-language-picker',
  imports: [],
  templateUrl: './language-picker.component.html',
  styleUrl: './language-picker.component.css',
})
export class LanguagePickerComponent implements OnInit, OnDestroy {
  @Output() languageSelected = new EventEmitter<string>();

  // Language titles for animation
  languageTitles = [
    { lang: 'en', text: 'Select Language' },
    { lang: 'es', text: 'Seleccionar Idioma' },
    { lang: 'zh', text: '选择语言' },
    { lang: 'hi', text: 'भाषा चुनें' },
    { lang: 'tl', text: 'Piliin ang Wika' },
    { lang: 'vi', text: 'Chọn Ngôn Ngữ' },
    { lang: 'ar', text: 'اختر اللغة' },
    { lang: 'fr', text: 'Sélectionner Langue' },
    { lang: 'ko', text: '언어 선택' },
    { lang: 'ru', text: 'Выбрать Язык' },
    { lang: 'de', text: 'Sprache Wählen' },
  ];

  currentTitleIndex = 0;
  isAnimating = false;
  private animationInterval: any;

  ngOnInit() {
    this.startLanguageAnimation();
  }

  ngOnDestroy() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }

  startLanguageAnimation() {
    this.animationInterval = setInterval(() => {
      this.cycleLanguage();
    }, 2000); // Change language every 2 seconds
  }

  cycleLanguage() {
    if (this.isAnimating) return;

    this.isAnimating = true;

    // Fade out current title
    setTimeout(() => {
      this.currentTitleIndex =
        (this.currentTitleIndex + 1) % this.languageTitles.length;
      this.isAnimating = false;
    }, 300); // Half of the transition time
  }

  get currentTitle() {
    return this.languageTitles[this.currentTitleIndex];
  }

  pick(lang: string) {
    // Stop the animation when user selects a language
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    this.languageSelected.emit(lang);
  }
}
