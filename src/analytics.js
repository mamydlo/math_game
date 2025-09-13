import ReactGA from 'react-ga4';

const MEASUREMENT_ID = 'G-LGTJ5V5HPR';

// Detect deployment environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const isGitHubPages = window.location.hostname.includes('github.io');

// Set to true if you want to completely disable analytics in development
const DISABLE_ANALYTICS_IN_DEV = false;

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
      debug_mode: !isProduction,
      send_page_view: false, // We'll handle page views manually
      cookie_domain: 'none',
      cookie_flags: isProduction ? 'SameSite=None;Secure' : 'SameSite=Lax',
      // Handle GitHub Pages subdirectory deployment
      custom_map: {
        'custom_parameter_1': 'app_name'
      },
      // Additional configuration for GitHub Pages
      ...(isGitHubPages && {
        cookie_path: '/math_game/',
        site_speed_sample_rate: 10
      })
    });
    
    console.log('Manual GA script loaded for domain:', window.location.hostname);
    console.log('Environment detection:', { isProduction, isGitHubPages });
  }
};

export const initGA = () => {
  // Skip analytics entirely in development if disabled
  if (!isProduction && DISABLE_ANALYTICS_IN_DEV) {
    console.log('Google Analytics disabled in development');
    return;
  }
  
  // Load script manually first
  loadGAScript();
  
  // Only initialize ReactGA as backup in production to avoid cookie conflicts in dev
  if (isProduction) {
    ReactGA.initialize(MEASUREMENT_ID, {
      debug: false,
      gtagOptions: {
        cookie_domain: 'none',
        cookie_flags: 'SameSite=None;Secure',
        ...(isGitHubPages && {
          cookie_path: '/math_game/'
        })
      }
    });
    console.log('Google Analytics (ReactGA backup) initialized for production');
  } else {
    console.log('Google Analytics (ReactGA backup) skipped in development to reduce cookie warnings');
  }
  
  console.log('Google Analytics initialized with ID:', MEASUREMENT_ID);
};

export const trackEvent = (action, category = 'Game', label = '', value = 0) => {
  // Skip tracking entirely in development if disabled
  if (!isProduction && DISABLE_ANALYTICS_IN_DEV) {
    console.log('Analytics disabled - would track event:', { action, category, label, value });
    return;
  }
  
  console.log('Tracking event:', { action, category, label, value });
  
  // Use ReactGA only in production to avoid cookie conflicts in dev
  if (isProduction) {
    ReactGA.event({
      action,
      category,
      label,
      value
    });
  }
  
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
  // Skip tracking entirely in development if disabled
  if (!isProduction && DISABLE_ANALYTICS_IN_DEV) {
    console.log('Analytics disabled - would track page view:', path);
    return;
  }
  
  console.log('Tracking page view:', path);
  
  // Use direct gtag for page views
  if (typeof window !== 'undefined' && window.gtag) {
    const fullPath = window.location.pathname + window.location.search;
    window.gtag('event', 'page_view', {
      page_title: 'Math Game',
      page_location: window.location.href,
      page_path: fullPath,
      send_to: MEASUREMENT_ID
    });
    console.log('Page view sent via gtag for path:', fullPath);
  }
  
  // Use ReactGA only in production to avoid cookie conflicts in dev
  if (isProduction) {
    ReactGA.event({
      action: 'page_view',
      category: 'engagement',
      label: path,
    });
  }
};
