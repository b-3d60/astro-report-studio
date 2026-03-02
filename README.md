# Astro Report Studio

A professional visual editor for creating beautiful reports and dossiers with PDF and HTML export. Build premium reports with an intuitive drag-and-drop interface.

## Features

- **Report Types**: Berichte (formal reports) & Dossier (premium portfolio-style)
- **Chapter-Based Structure**: Organize content into chapters with automatic table of contents
- **Rich Content Blocks**: Headings, text, images, galleries, tables, metrics, timelines, and more
- **PDF Export**: Generate high-quality PDF documents with professional styling
- **Astro Export**: Export as responsive HTML with production-ready Astro components
- **Premium Design**: Inspired by high-end portfolio designs (re:think yachting aesthetic)
- **Flexible Styling**: Full control over typography, colors, spacing, and layout
- **Header/Footer Management**: Auto-numbered pages with customizable headers and footers
- **Asset Management**: Firebase Cloud Storage support for media uploads
- **Template Library**: Pre-designed templates for common report types

## Quick Start

**Prerequisites:** Node.js 18+

1. Clone the repository:
   ```bash
   git clone https://github.com/b-3d60/astro-report-studio.git
   cd astro-report-studio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Build

Generate optimized production build:
```bash
npm run build
```

## Project Structure

```
src/
├── App.tsx              # Main report editor component
├── components/          # UI components for editing
├── lib/
│   ├── reportRenderer.ts   # Report → HTML rendering
│   └── pdfExporter.ts      # HTML → PDF export
├── types.ts            # TypeScript interfaces
└── index.tsx           # React root
```

## Report Types

### Bericht (Report)
- Formal, structured layout
- Use case: Business reports, analyses, documentation
- Features: Chapter overview, index, table numbering
- Default: Professional styling with margins

### Dossier
- Premium, high-end visual design
- Use case: Portfolio, real estate, projects, case studies
- Features: Full-bleed images, editorial layout, galleries
- Inspired by: re:think yachting aesthetic

## Block Types

- **Text Styling**: Headings (H1, H2, H3), body text, highlights
- **Lists**: Bullet points, numbered lists
- **Images**: Single images, galleries with captions
- **Layout**: 2/3/4-column layouts, containers, spacers
- **Data**: Tables, metrics, timelines
- **Special**: Page breaks, chapter dividers, quotes, TOC

## PDF Export

Export reports as high-quality PDF:
- Multiple paper formats: A3, A4, Letter
- Portrait & landscape orientation
- Custom margins and spacing
- Header/footer with page numbering
- Quality options: draft, standard, high

## Astro Export

Generate responsive Astro components:
- Full HTML/CSS output
- Responsive design
- Ready for deployment
- ZIP export option

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite 6.4** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **jsPDF** - PDF generation
- **html2canvas** - HTML to image conversion
- **Astro** - Static site generation (export target)

## License

MIT

---

**Built with ❤️ for creating beautiful reports**
