import ReactGA from 'react-ga4';

const MEASUREMENT_ID = 'G-LGTJ5V5HPR';

// Load Google Analytics script manually for better control
const loadGAScript = () => {
  if (typeof window !== 'undefined' && !window.gtag) {
    // Create script tag for gtag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      debug_mode: true,
      send_page_view: false // We'll handle page views manually
    });
    
    console.log('Manual GA script loaded');
  }
};

export const initGA = () => {
  // Load script manually first
  loadGAScript();
  
  // Also initialize with react-ga4 as backup
  ReactGA.initialize(MEASUREMENT_ID, {
    debug: true, // Enable debug mode for development
  });
  console.log('Google Analytics initialized with ID:', MEASUREMENT_ID);
};

export const trackEvent = (action, category = 'Game', label = '', value = 0) => {
  console.log('Tracking event:', { action, category, label, value });
  
  // Use both methods to ensure events are sent
  ReactGA.event({
    action,
    category,
    label,
    value
  });
  
  // Also use gtag directly for better GA4 compatibility
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      custom_parameter_1: 'math_game',
      send_to: MEASUREMENT_ID,
      // Force immediate sending
      transport_type: 'beacon',
      event_timeout: 2000
    });
    console.log('Event also sent via gtag with forced sending');
    
    // Debug: Check dataLayer contents
    setTimeout(() => {
      if (window.dataLayer) {
        console.log('DataLayer contents:', window.dataLayer.slice(-5)); // Show last 5 entries
      }
    }, 200);
    
  } else {
    console.log('gtag not available on window');
  }
};

export const trackPageView = (path) => {
  console.log('Tracking page view:', path);
  
  // Use direct gtag for page views
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: 'Math Game',
      page_location: window.location.href,
      page_path: path,
    });
    console.log('Page view sent via gtag');
  }
  
  // Also use ReactGA as backup
  ReactGA.event({
    action: 'page_view',
    category: 'engagement',
    label: path,
  });
};
