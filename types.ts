// ============================================================================
// REPORT TYPES - Core Structure
// ============================================================================

export type ReportType = 'bericht' | 'dossier';

export type ReportBlockType = 
  // Text Content
  | 'h1' | 'h2' | 'h3' 
  | 'text' 
  | 'highlight' 
  | 'bullets' 
  | 'quote-block'
  | 'citation'
  // Media
  | 'image' 
  | 'gallery' 
  | 'video'
  | 'embed'
  // Layout
  | 'columns'
  | 'container'
  | 'spacer' 
  | 'divider' 
  // Interactive
  | 'button'
  | 'link'
  | 'cta'
  // Data Visualization
  | 'table'
  | 'metrics'
  | 'timeline'
  | 'faq'
  | 'database'
  // Report Specific
  | 'page-break'
  | 'chapter-divider'
  | 'cover-page'
  | 'toc'; // Table of Contents (auto-generated)

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface DatabaseItem {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  contentBlocks?: ReportBlock[];
}

export interface ReportBlock {
  id: string;
  type: ReportBlockType;
  content: string;
  metadata?: {
    // Images & Gallery
    src?: string;
    caption?: string;
    images?: GalleryImage[];
    
    // Columns - unified system with variable column count
    columns?: ReportBlock[][];
    columnCount?: number;
    
    // Text Styling
    alignment?: 'left' | 'center' | 'right';
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '500' | '600';
    
    // Highlight/Callout
    highlightColor?: string;
    highlightOpacity?: number;
    highlightIcon?: '💡' | 'ℹ️' | '⚠️' | '🛑' | '✅' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
    
    // Lists
    listStyle?: 'bullets' | 'numbered';
    
    // Table
    tableData?: string[][];
    tableHeader?: boolean;
    
    // Metrics
    metricsData?: MetricItem[];
    
    // Timeline
    timelineItems?: TimelineItem[];
    
    // Container
    containerBlocks?: ReportBlock[];
    containerBgColor?: string;
    containerOpacity?: number;
    
    // Button & CTA
    buttonText?: string;
    buttonLink?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    
    // Link
    link?: string;
    
    // Citation
    citationAuthor?: string;
    
    // Video & Embed
    height?: number;
    embedWidth?: number;
    embedHeight?: number;
    
    // FAQ
    faqItems?: FAQItem[];
    
    // Database
    dbItems?: DatabaseItem[];
    dbView?: 'grid' | 'list';
    collectionName?: string;
    sourceId?: string;
    activeFilter?: string;
    
    // Page Break
    pageBreakType?: 'before' | 'after';
    
    // Chapter Divider
    chapterNumber?: number;
    chapterTitle?: string;
    
    // Cover Page
    coverPageVariant?: 'standard' | 'minimal' | 'luxury';
    coverPageSubtitle?: string;
    coverPageVersion?: string;
    coverPageConfidentiality?: string; // e.g. "Confidential", "Public", "Internal"
    coverPageBranding?: string; // Logo URL or text
    
    // Generic metadata
    title?: string;
    description?: string;
  };
}

export interface GalleryImage {
  id: string;
  src: string;
  caption?: string;
}

export interface MetricItem {
  id: string;
  label: string;
  value: string;
  unit?: string;
  color?: string;
}

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description: string;
}

// ============================================================================
// CHAPTER STRUCTURE
// ============================================================================

export interface Chapter {
  id: string;
  title: string;
  blocks: ReportBlock[];
  isTableOfContents?: boolean;
  isCoverPage?: boolean;
}

// ============================================================================
// REPORT SETTINGS
// ============================================================================

export type PaperFormat = 'A3' | 'A4' | 'Letter';
export type Orientation = 'portrait' | 'landscape';

export interface ReportSettings {
  // Metadata
  title: string;
  description?: string;
  author?: string;
  date?: string;
  reportType: ReportType;
  
  // Paper/PDF Settings
  paperFormat: PaperFormat;
  orientation: Orientation;
  marginTop: number; // in mm
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  
  // Typography & Styling
  fontFamily: string; // e.g., "'Inter', sans-serif"
  headingFontFamily: string;
  baseFontSize: number; // in px
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  
  // Features
  pageNumbering: boolean;
  headerFooterEnabled: boolean;
  headerText?: string;
  footerText?: string;
  tocEnabled?: boolean;
  
  // Branding
  sidebarBrandLine1?: string; // e.g., "re:think yachting"
  sidebarBrandLine2?: string; // e.g., "report & dossier studio"
  sidebarFooterText?: string; // e.g., "re:think yachting UG - Hamburg"
  reportFooterText?: string; // e.g., "Mastery re:engineered."
  
  // Layout Options
  layoutVariant?: 'default' | 'minimal' | 'corporate';
  coverPageEnabled?: boolean;
  tocPosition?: 'start' | 'after-cover'; // Position of table of contents
  
  // PDF Options
  pdfQuality?: 'draft' | 'standard' | 'high';
  embedFonts?: boolean;
  compressImages?: boolean;
  
  // Storage Configuration  
  storageConfig?: {
    projectId: string;
    bucketName: string;
    region: string;
    apiKey?: string;
    authDomain?: string;
    enabled: boolean;
  };
}

// ============================================================================
// REPORT - Main Structure
// ============================================================================

export interface Report {
  id: string;
  title: string;
  description?: string;
  chapters: Chapter[];
  settings: ReportSettings;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PROJECT (for local storage)
// ============================================================================

export interface Project {
  id: string;
  name: string;
  reports: Report[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PDF/EXPORT OPTIONS
// ============================================================================

export interface PDFExportOptions {
  filename: string;
  quality?: 'draft' | 'standard' | 'high';
  includeMetadata?: boolean;
  openAfterExport?: boolean;
}

export interface AstroExportOptions {
  projectName: string;
  createZip?: boolean;
}

// ============================================================================
// ASTRO RENDER RESULT
// ============================================================================

export interface AstroRenderResult {
  layoutCode: string;
  pageCode: string;
  files: RenderedFile[];
}

export interface RenderedFile {
  path: string;
  code: string;
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
}

export interface JSONLDConfig {
  enabled: boolean;
  name?: string;
  url?: string;
  logo?: string;
  image?: string;
  description?: string;
  telephone?: string;
  email?: string;
  streetAddress?: string;
  postalCode?: string;
  addressLocality?: string;
  addressCountry?: string;
  areaServed?: string;
  founder?: string;
  sameAs?: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface NavItem {
  id: string;
  label: string;
  type: 'page' | 'group' | 'link';
  pageId?: string;
  href?: string;
  children?: NavItem[];
}

export interface DatabaseItem {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  contentBlocks?: Block[];
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    src?: string;
    caption?: string;
    images?: GalleryImage[]; 
    columns?: Block[][];
    columnCount?: number;
    buttonText?: string;
    buttonLink?: string;
    link?: string;
    height?: number; 
    embedWidth?: number;
    embedHeight?: number;
    title?: string;
    description?: string;
    alignment?: 'left' | 'center' | 'right';
    variant?: 'primary' | 'secondary' | 'outline';
    dbItems?: DatabaseItem[];
    dbView?: 'grid' | 'list';
    collectionName?: string;
    sourceId?: string;
    activeFilter?: string;
    citationAuthor?: string;
    highlightIcon?: '💡' | 'ℹ️' | '⚠️' | '🛑' | '✅' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
    highlightColor?: string;
    highlightOpacity?: number;
    listStyle?: 'bullets' | 'numbered';
    faqItems?: FAQItem[];
    containerBlocks?: Block[];
    containerBgColor?: string;
    containerOpacity?: number;
  };
}

export interface SiteSettings {
  siteName: string;
  logoText: string;
  logoImage?: string;
  logoSize?: number;
  favicon?: string;
  footerText: string;
  accentColor: string;
  containerWidth: number;
  companyName: string;
  footerLinks: FooterLink[];
  navigation: NavItem[];
  showFacebook: boolean;
  facebookLink?: string;
  showLinkedIn: boolean;
  linkedinLink?: string;
  showInstagram: boolean;
  instagramLink?: string;
  theme?: {
    fontFamily: string;
    headingFontFamily?: string;
    mainPageBackground: string;
    mainText: string;
    mainLightText: string;
    mainBorderColor: string;
    mainHoverBackground: string;
    mainHoverBackgroundOpacity?: number;
    mainCheckboxBackground: string;
    navbarText: string;
    navbarBackground: string;
    navbarButtonText: string;
    navbarButtonBackground: string;
    burgerMenuIconColor?: string;
    burgerMenuBackground?: string;
    burgerMenuBorder?: string;
    baseFontSize?: number;
    titleScale?: number;
    headingScale?: number;
    quoteScale?: number;
    quoteLargeScale?: number;
    footerText: string;
    footerBackground: string;
    sidebarText: string;
    sidebarBackground: string;
    sidebarHoverBackground: string;
    sidebarBottomText: string;
    sidebarBottomBackground: string;
    sidebarBorder: string;
    collectionCardBackground: string;
    collectionCardHoverBackground: string;
    collectionCalendarWeekendBackground: string;
    scrollbarBackground: string;
    scrollbarHandle: string;
    scrollbarBorder: string;
    blockColorPalette?: string[];
    radius: number;
  };
  storageConfig?: {
    projectId: string;
    bucketName: string;
    region: string;
    apiKey?: string;
    authDomain?: string;
    enabled: boolean;
  };
  googleAnalyticsId?: string;
  cookieConsentId?: string;
  jsonLd?: JSONLDConfig;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  blocks: Block[];
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  manualSlug?: boolean;
}

export interface PageState {
  title: string;
  blocks: Block[];
}

export interface Project {
  id: string;
  name: string;
  pages: Page[];
  currentPageId: string;
  siteSettings: SiteSettings;
}
