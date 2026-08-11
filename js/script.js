class BandWebsite {
  constructor() {
    this.navToggle = document.querySelector('.nav-toggle');
    this.navList = document.querySelector('.nav-list');
    this.modal = document.getElementById('image-modal');
    this.modalImage = document.getElementById('image-modal-img');
    this.modalClose = document.querySelector('.image-modal-close');
    this.modalPrevious = document.querySelector('.image-modal-arrow-left');
    this.modalNext = document.querySelector('.image-modal-arrow-right');
    this.modalCaption = document.getElementById('image-modal-caption');
    this.modalCount = document.querySelector('.image-modal-count');
    this.currentGallery = [];
    this.currentIndex = 0;
    this.lastFocusedElement = null;
    this.imageRequest = 0;

    this.setupNavigation();
    this.setupMemberProfiles();
    this.setupGallery();
  }

  setupNavigation() {
    const closeMenu = () => {
      this.navList.classList.remove('show');
      this.navToggle.setAttribute('aria-expanded', 'false');
      this.navToggle.setAttribute('aria-label', 'Mở menu');
    };

    this.navToggle.addEventListener('click', () => {
      const isOpen = this.navList.classList.toggle('show');
      this.navToggle.setAttribute('aria-expanded', String(isOpen));
      this.navToggle.setAttribute('aria-label', isOpen ? 'Đóng menu' : 'Mở menu');
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.nav-menu')) closeMenu();
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start'
        });
        closeMenu();
      });
    });

    const sections = [...document.querySelectorAll('section[id]')];
    const links = [...document.querySelectorAll('.nav-link')];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'page');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach((section) => observer.observe(section));
  }

  setupMemberProfiles() {
    const cards = [...document.querySelectorAll('.member-card')];
    const details = [...document.querySelectorAll('.member-detail')];

    const selectMember = (card, shouldScroll = true) => {
      const detail = document.getElementById(`member-detail-${card.dataset.member}`);
      const wasActive = card.classList.contains('active');
      cards.forEach((item) => {
        item.classList.remove('active');
        item.querySelector('.member-card-header').setAttribute('aria-expanded', 'false');
      });
      details.forEach((item) => {
        item.classList.remove('show');
        item.hidden = true;
      });
      if (wasActive) return;
      card.classList.add('active');
      card.querySelector('.member-card-header').setAttribute('aria-expanded', 'true');
      detail.hidden = false;
      detail.classList.add('show');
      if (shouldScroll) {
        requestAnimationFrame(() => detail.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start'
        }));
      }
    };

    cards.forEach((card) => {
      const trigger = card.querySelector('.member-card-header');
      const detailId = `member-detail-${card.dataset.member}`;
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('tabindex', '0');
      trigger.setAttribute('aria-controls', detailId);
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', () => selectMember(card));
      trigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectMember(card);
        }
      });
    });

    details.forEach((detail) => { detail.hidden = true; });
  }

  setupGallery() {
    document.querySelectorAll('.member-gallery-instagram').forEach((gallery) => {
      const images = [...gallery.querySelectorAll('.member-gallery-img')];
      images.forEach((image, index) => {
        image.decoding = 'async';
        image.fetchPriority = 'low';
        image.setAttribute('tabindex', '0');
        image.setAttribute('role', 'button');
        image.setAttribute('aria-label', `Xem ảnh lớn: ${image.alt}`);
        const open = () => this.openModal(images, index, image);
        image.addEventListener('click', open);
        image.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
          }
        });
      });
    });

    this.modalPrevious.addEventListener('click', () => this.showImage(this.currentIndex - 1));
    this.modalNext.addEventListener('click', () => this.showImage(this.currentIndex + 1));
    this.modalClose.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (event) => {
      if (event.target === this.modal) this.closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (this.modal.hidden) return;
      if (event.key === 'Escape') this.closeModal();
      if (event.key === 'ArrowLeft') this.showImage(this.currentIndex - 1);
      if (event.key === 'ArrowRight') this.showImage(this.currentIndex + 1);
    });
  }

  openModal(images, index, trigger) {
    this.currentGallery = images;
    this.lastFocusedElement = trigger;
    this.modal.hidden = false;
    document.body.classList.add('modal-open');
    this.showImage(index);
    this.modalClose.focus();
  }

  async showImage(index) {
    if (!this.currentGallery.length) return;
    const nextIndex = (index + this.currentGallery.length) % this.currentGallery.length;
    const image = this.currentGallery[nextIndex];
    const source = image.currentSrc || image.src;
    const requestId = ++this.imageRequest;
    const preload = new Image();

    this.modal.dataset.state = 'loading';
    this.modal.setAttribute('aria-busy', 'true');
    preload.src = source;
    try {
      await preload.decode();
    } catch {
      if (!preload.complete) {
        await new Promise((resolve) => {
          preload.onload = resolve;
          preload.onerror = resolve;
        });
      }
    }
    if (requestId !== this.imageRequest || this.modal.hidden) return;

    this.currentIndex = nextIndex;
    this.modalImage.src = source;
    this.modalImage.alt = image.alt;
    this.modalCaption.textContent = image.alt;
    this.modalCount.textContent = `${nextIndex + 1} / ${this.currentGallery.length}`;
    this.modal.dataset.state = 'ready';
    this.modal.setAttribute('aria-busy', 'false');

    [-1, 1].forEach((offset) => {
      const neighbor = this.currentGallery[(nextIndex + offset + this.currentGallery.length) % this.currentGallery.length];
      const neighborImage = new Image();
      neighborImage.src = neighbor.currentSrc || neighbor.src;
    });
  }

  closeModal() {
    this.imageRequest += 1;
    this.modal.hidden = true;
    this.modalImage.removeAttribute('src');
    this.modalCaption.textContent = '';
    this.modalCount.textContent = '';
    this.modal.removeAttribute('data-state');
    this.modal.removeAttribute('aria-busy');
    document.body.classList.remove('modal-open');
    this.lastFocusedElement?.focus();
    this.currentGallery = [];
  }
}

document.addEventListener('DOMContentLoaded', () => new BandWebsite());
