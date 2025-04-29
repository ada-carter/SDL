const RESOURCE_TYPES = {
  PERSON: { icon: 'fa-user', label: 'Person' },
  BOOK: { icon: 'fa-book', label: 'Book' },
  VIDEO: { icon: 'fa-video', label: 'Video' },
  CHANNEL: { icon: 'fa-video', label: 'YouTube Channel' },
  COURSE: { icon: 'fa-graduation-cap', label: 'Course' },
  WEBSITE: { icon: 'fa-globe', label: 'Website' },
  PODCAST: { icon: 'fa-podcast', label: 'Podcast' },
  COMMUNITY: { icon: 'fa-users', label: 'Community' },
  TOOL: { icon: 'fa-tools', label: 'Tool' },
  OTHER: { icon: 'fa-star', label: 'Other' }
};

// Add a mobile detection utility function
function isMobileDevice() {
  return window.innerWidth <= 768 || 
         navigator.maxTouchPoints > 0 || 
         navigator.msMaxTouchPoints > 0 ||
         window.matchMedia("(pointer: coarse)").matches;
}

class ResourceManager {
  constructor() {
    this.resources = [];
    this.container = document.querySelector('#resourceCards');
    this.setupListeners();
    
    // Try to load resources from localStorage
    this.loadResources();
    
    // Check if we're on mobile and adjust the layout if needed
    this.isMobile = isMobileDevice();
    window.addEventListener('resize', () => {
      const wasMobile = this.isMobile;
      this.isMobile = isMobileDevice();
      
      // Only update if mobile state changed
      if (wasMobile !== this.isMobile) {
        this.adjustForMobile();
      }
    });
    
    // Initial mobile adjustment
    this.adjustForMobile();
  }

  setupListeners() {
    document.querySelector('#addResourceBtn').addEventListener('click', () => this.showAddForm());
    document.querySelector('#saveResourceBtn').addEventListener('click', () => this.saveResource());
    document.querySelector('#cancelResourceBtn').addEventListener('click', () => this.hideAddForm());
    // Close form on cancel/save; no modal overlay

    // Prevent clicks inside the form from closing the form (if nested handlers exist)
    document.querySelector('#resourceForm').addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  reinitialize() {
    this.resources = [];
    this.container.innerHTML = '';
    this.hideAddForm();
    this.loadResources();
  }

  showAddForm() {
    const form = document.querySelector('#resourceForm');
    const typeSelect = document.querySelector('#resourceType');
    const nameInput = document.querySelector('#resourceName');
    const descriptionInput = document.querySelector('#resourceDescription');
    
    // Clear all form fields
    typeSelect.value = '';
    nameInput.value = '';
    descriptionInput.value = '';
    
    // Populate type dropdown if needed
    if (!typeSelect.children.length || typeSelect.children.length === 1) {
      typeSelect.innerHTML = '<option value="">Select type...</option>';
      Object.entries(RESOURCE_TYPES).forEach(([key, {label}]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = label;
        typeSelect.appendChild(option);
      });
    }
    
    // Show form with animation frame for smooth transition
    requestAnimationFrame(() => {
      form.classList.add('active');
    });
  }

  hideAddForm() {
    const form = document.querySelector('#resourceForm');
    form.classList.remove('active');
    form.reset();
  }

  saveResource() {
    const type = document.querySelector('#resourceType').value;
    const name = document.querySelector('#resourceName').value.trim();
    const description = document.querySelector('#resourceDescription').value.trim();
    
    if (!type || !name || !description) {
      alert('Please fill out all fields');
      return;
    }
    
    const resource = { type, name, description, id: Date.now() };
    this.resources.push(resource);
    this.renderCard(resource);
    this.hideAddForm();
    this.updateSummary();
    this.saveResources();
  }

  renderCard({ type, name, description, id }) {
    const { icon } = RESOURCE_TYPES[type] || { icon: 'fa-question' };
    const card = document.createElement('div');
    card.className = 'resource-card glass';
    card.dataset.id = id;
    
    // Create a more compact layout for mobile
    const isMobileView = this.isMobile;
    
    card.innerHTML = `
      <i class="fas ${icon} resource-icon"></i>
      <div class="resource-content">
        <h3>${name}${isMobileView ? ` <small>(${RESOURCE_TYPES[type]?.label || 'Resource'})</small>` : ''}</h3>
        <p>${description}</p>
      </div>
      <button class="remove-resource" aria-label="Remove resource">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    card.querySelector('.remove-resource').addEventListener('click', () => this.removeResource(id));
    this.container.appendChild(card);
  }

  removeResource(id) {
    this.resources = this.resources.filter(r => r.id !== id);
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) card.remove();
    this.updateSummary();
    this.saveResources();
  }

  updateSummary() {
    const summary = this.resources
      .map(r => `${r.name} (${RESOURCE_TYPES[r.type]?.label || 'Resource'}): ${r.description}`)
      .join('\n');
    document.querySelector('#answer4').value = summary;
  }

  saveResources() {
    localStorage.setItem('sdlResources', JSON.stringify(this.resources));
  }

  loadResources() {
    try {
      const savedResources = JSON.parse(localStorage.getItem('sdlResources') || '[]');
      if (Array.isArray(savedResources) && savedResources.length) {
        this.resources = savedResources;
        this.resources.forEach(resource => this.renderCard(resource));
        this.updateSummary();
      }
    } catch (e) {
      console.error('Error loading resources:', e);
    }
  }

  // Add a method to adjust the layout for mobile devices
  adjustForMobile() {
    if (this.isMobile) {
      // Clear and redraw all cards optimized for mobile
      const resourcesCopy = [...this.resources];
      this.container.innerHTML = '';
      resourcesCopy.forEach(resource => this.renderCard(resource));
      
      // Add mobile-specific class to container
      this.container.classList.add('mobile-layout');
    } else {
      // Remove mobile-specific styling
      this.container.classList.remove('mobile-layout');
    }
  }
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
  // Initialize resource manager
  window.resourceManager = new ResourceManager();
});