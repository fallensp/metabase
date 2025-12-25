const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer,
        AlignmentType, PageNumber, BorderStyle, WidthType, ShadingType, VerticalAlign,
        HeadingLevel, LevelFormat, PageBreak } = require('docx');
const fs = require('fs');

// Brand colors
const PRIMARY_COLOR = "005F73";      // Teal
const SECONDARY_COLOR = "0A9396";    // Aqua
const ACCENT_COLOR = "EE9B00";       // Orange
const LIGHT_BG = "E8F4F6";           // Light teal background
const HEADER_BG = "005F73";          // Teal header

// Table border style
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// Helper to create header cell
function headerCell(text, width) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22, font: "Arial" })]
    })]
  });
}

// Helper to create data cell
function dataCell(text, width, options = {}) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: options.shading ? { fill: options.shading, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: options.align || AlignmentType.LEFT,
      spacing: { before: 60, after: 60 },
      children: [new TextRun({
        text,
        bold: options.bold || false,
        size: options.size || 20,
        font: "Arial",
        color: options.color || "333333"
      })]
    })]
  });
}

// Create the document
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 72, bold: true, color: PRIMARY_COLOR, font: "Arial" },
        paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: PRIMARY_COLOR, font: "Arial" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: SECONDARY_COLOR, font: "Arial" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: "333333", font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "benefits-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "deliverables-list",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [
    // ==================== COVER PAGE ====================
    {
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      children: [
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "PROPOSAL", size: 32, color: SECONDARY_COLOR, font: "Arial", bold: true })]
        }),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Enterprise Data", size: 72, bold: true, color: PRIMARY_COLOR, font: "Arial" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Visualization Platform", size: 72, bold: true, color: PRIMARY_COLOR, font: "Arial" })]
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Transforming ERP Data into Actionable Business Insights", size: 26, color: "666666", font: "Arial", italics: true })]
        }),
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Prepared for:", size: 22, color: "666666", font: "Arial" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "Kintex Sdn Bhd", size: 28, bold: true, color: "333333", font: "Arial" })]
        }),
        new Paragraph({ spacing: { before: 800 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Date: 25th December 2025", size: 22, color: "666666", font: "Arial" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "Version 1.0", size: 22, color: "666666", font: "Arial" })]
        })
      ]
    },
    // ==================== MAIN CONTENT ====================
    {
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Enterprise Data Visualization Platform | Proposal", size: 18, color: "999999", font: "Arial" })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 18, color: "999999", font: "Arial" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999", font: "Arial" }),
              new TextRun({ text: " of ", size: 18, color: "999999", font: "Arial" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "999999", font: "Arial" })
            ]
          })]
        })
      },
      children: [
        // ==================== EXECUTIVE SUMMARY ====================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Executive Summary")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("The Challenge")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Sales and executive teams lack a unified view of business performance. Data lives in the ERP system but isn't accessible for daily decision-making, pipeline monitoring, or strategic analysis.", size: 22, font: "Arial" })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("The Solution")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "A custom data visualization platform that automatically extracts data from your ERP, transforms it into actionable insights, and delivers interactive dashboards tailored for Sales Teams and Executives—with automated daily reports delivered to stakeholders.", size: 22, font: "Arial" })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Key Benefits")] }),
        new Paragraph({ numbering: { reference: "benefits-list", level: 0 }, spacing: { after: 80 },
          children: [new TextRun({ text: "Single source of truth for sales metrics", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "benefits-list", level: 0 }, spacing: { after: 80 },
          children: [new TextRun({ text: "Reduce manual reporting effort by 80%+", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "benefits-list", level: 0 }, spacing: { after: 80 },
          children: [new TextRun({ text: "Enable data-driven decisions with fresh daily data", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "benefits-list", level: 0 }, spacing: { after: 80 },
          children: [new TextRun({ text: "Role-based views for different audiences", size: 22, font: "Arial" })] }),
        new Paragraph({ numbering: { reference: "benefits-list", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Active intelligence that pushes insights to you—no more hunting through reports", size: 22, font: "Arial" })] }),

        // ==================== ACTIVE VS PASSIVE INTELLIGENCE ====================
        new Paragraph({ spacing: { before: 300 } }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("From Passive Reports to Active Intelligence")] }),

        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Your ERP system provides solid reporting via web and mobile—but it's passive. Users must navigate to reports to find insights, and the standard reports may not fully address your specific business questions. Our platform complements your ERP by actively pushing tailored, actionable insights to the right people at the right time.", size: 22, font: "Arial" })]
        }),

        // Comparison table
        new Table({
          columnWidths: [4680, 4680],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 4680, type: WidthType.DXA },
                  shading: { fill: "FFF5E5", type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 },
                    children: [new TextRun({ text: "PASSIVE (ERP Reports)", bold: true, size: 22, color: "996600", font: "Arial" })] })]
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 4680, type: WidthType.DXA },
                  shading: { fill: "E5FFE5", type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 },
                    children: [new TextRun({ text: "ACTIVE (With Platform)", bold: true, size: 22, color: "006600", font: "Arial" })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                dataCell("Users navigate to reports when needed", 4680),
                dataCell("Platform pushes daily digest automatically", 4680, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("Standard reports with fixed formats", 4680),
                dataCell("Custom visualizations tailored to your needs", 4680, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("Data available, but insights require interpretation", 4680),
                dataCell("AI-generated insights with clear action points", 4680, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("Same view for all users", 4680),
                dataCell("Role-specific dashboards (Management vs Sales)", 4680, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("Alerts require manual monitoring", 4680),
                dataCell("Proactive warnings pushed via email & platform", 4680, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("Historical focus—what happened", 4680),
                dataCell("Predictive focus—what to do next", 4680, { shading: LIGHT_BG })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 300 } }),
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Example Active Digests")] }),

        new Paragraph({
          spacing: { after: 150 },
          children: [new TextRun({ text: "Based on your metrics requirements, here are examples of actionable insights the platform will actively deliver:", size: 22, font: "Arial" })]
        }),

        // Management digest examples
        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: "For Management:", bold: true, size: 22, color: PRIMARY_COLOR, font: "Arial" })]
        }),

        new Table({
          columnWidths: [9360],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 1, color: ACCENT_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 1, color: ACCENT_COLOR }, left: { style: BorderStyle.SINGLE, size: 4, color: ACCENT_COLOR }, right: { style: BorderStyle.SINGLE, size: 1, color: ACCENT_COLOR } },
                  shading: { fill: "FFF8E8", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ spacing: { before: 120, after: 60 },
                      children: [new TextRun({ text: "⚠ CHURN RISK ALERT", bold: true, size: 20, color: ACCENT_COLOR, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 60 },
                      children: [new TextRun({ text: "3 key accounts showing churn risk indicators:", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 40 },
                      children: [new TextRun({ text: "• ABC Furniture (RM 45K/month) — No purchase in 67 days, declining order frequency", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 40 },
                      children: [new TextRun({ text: "• XYZ Auto Parts (RM 32K/month) — Credit limit 95% utilized, payment delays increasing", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 80 },
                      children: [new TextRun({ text: "• Mega Canvas Co (RM 28K/month) — Order value dropped 40% vs last quarter", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 120 },
                      children: [
                        new TextRun({ text: "Recommended Action: ", bold: true, size: 20, font: "Arial" }),
                        new TextRun({ text: "Schedule executive check-in with account managers for these accounts this week.", size: 20, font: "Arial" })
                      ] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 150 } }),

        new Table({
          columnWidths: [9360],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 1, color: PRIMARY_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 1, color: PRIMARY_COLOR }, left: { style: BorderStyle.SINGLE, size: 4, color: PRIMARY_COLOR }, right: { style: BorderStyle.SINGLE, size: 1, color: PRIMARY_COLOR } },
                  shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ spacing: { before: 120, after: 60 },
                      children: [new TextRun({ text: "📊 EARLY WARNING: Declining Categories", bold: true, size: 20, color: PRIMARY_COLOR, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 60 },
                      children: [new TextRun({ text: "2 product categories showing consistent weekly decline:", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 40 },
                      children: [new TextRun({ text: "• Tarpaulin: -12% WoW for 3 consecutive weeks (seasonal pattern or market shift?)", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 80 },
                      children: [new TextRun({ text: "• Accessories: -8% WoW, correlates with Canvas category decline", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 120 },
                      children: [
                        new TextRun({ text: "Recommended Action: ", bold: true, size: 20, font: "Arial" }),
                        new TextRun({ text: "Review pricing strategy and check competitor activity in these segments.", size: 20, font: "Arial" })
                      ] })
                  ]
                })
              ]
            })
          ]
        }),

        // Sales team digest examples
        new Paragraph({
          spacing: { before: 250, after: 100 },
          children: [new TextRun({ text: "For Sales Team:", bold: true, size: 22, color: PRIMARY_COLOR, font: "Arial" })]
        }),

        new Table({
          columnWidths: [9360],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "22AA22" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "22AA22" }, left: { style: BorderStyle.SINGLE, size: 4, color: "22AA22" }, right: { style: BorderStyle.SINGLE, size: 1, color: "22AA22" } },
                  shading: { fill: "F0FFF0", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ spacing: { before: 120, after: 60 },
                      children: [new TextRun({ text: "🎯 YOUR ACTION ITEMS TODAY", bold: true, size: 20, color: "22AA22", font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 60 },
                      children: [new TextRun({ text: "Good morning! Here's what needs your attention:", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 40 },
                      children: [new TextRun({ text: "• 5 customers likely to reorder this week (based on purchase patterns) — Call list attached", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 40 },
                      children: [new TextRun({ text: "• 2 customers hit 90+ days without purchase — High churn risk, recommend personal visit", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 80 },
                      children: [new TextRun({ text: "• Stock alert: PVC Leather (Cream) running low — Inform customers to order early", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 120 },
                      children: [
                        new TextRun({ text: "Your Progress: ", bold: true, size: 20, font: "Arial" }),
                        new TextRun({ text: "RM 48,500 this week (72% of weekly target) — RM 18,800 to go!", size: 20, font: "Arial" })
                      ] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 150 } }),

        new Table({
          columnWidths: [9360],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 1, color: SECONDARY_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 1, color: SECONDARY_COLOR }, left: { style: BorderStyle.SINGLE, size: 4, color: SECONDARY_COLOR }, right: { style: BorderStyle.SINGLE, size: 1, color: SECONDARY_COLOR } },
                  shading: { fill: "F0F9FA", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ spacing: { before: 120, after: 60 },
                      children: [new TextRun({ text: "💡 CROSS-SELL OPPORTUNITY", bold: true, size: 20, color: SECONDARY_COLOR, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 60 },
                      children: [new TextRun({ text: "Customer \"Comfort Sofa Mfg\" bought Upholstery Fabric (RM 12,400) last week.", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 80 },
                      children: [new TextRun({ text: "Similar customers also purchased: Foam Adhesive (68% attach rate), Webbing Straps (52%)", size: 20, font: "Arial" })] }),
                    new Paragraph({ spacing: { after: 120 },
                      children: [
                        new TextRun({ text: "Suggested Action: ", bold: true, size: 20, font: "Arial" }),
                        new TextRun({ text: "Follow up with complementary product bundle offer — potential RM 3,200 additional sale.", size: 20, font: "Arial" })
                      ] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({
          spacing: { before: 250, after: 200 },
          children: [new TextRun({ text: "These insights are delivered automatically via the platform dashboard and daily email digests—ensuring nothing falls through the cracks.", size: 22, font: "Arial", italics: true })]
        }),

        // ==================== SOLUTION ARCHITECTURE ====================
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Solution Architecture")] }),

        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: "The platform consists of four integrated components working together to deliver insights from your ERP data:", size: 22, font: "Arial" })]
        }),

        // Architecture diagram as table
        new Table({
          columnWidths: [9360],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY_COLOR }, left: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY_COLOR }, right: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY_COLOR } },
                  shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
                      children: [new TextRun({ text: "SOLUTION ARCHITECTURE", bold: true, size: 24, color: PRIMARY_COLOR, font: "Arial" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
                      children: [
                        new TextRun({ text: "┌─────────────┐      ┌─────────────┐      ┌─────────────┐", size: 18, font: "Courier New", color: "333333" })
                      ] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "│  ERP DATA   │ ───► │ ETL PIPELINE│ ───► │ ANALYTICS DB│", size: 18, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "│  (Source)   │      │  (Nightly)  │      │ (PostgreSQL)│", size: 18, font: "Courier New", color: "666666" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
                      children: [new TextRun({ text: "└─────────────┘      └─────────────┘      └──────┬──────┘", size: 18, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "                                                │", size: 18, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "                    ┌───────────────────────────┴───────────────────────────┐", size: 18, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "                    │                                                       │", size: 18, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "           ┌────────▼────────┐                              ┌───────▼───────┐", size: 18, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "           │ CUSTOM PLATFORM │                              │   METABASE    │", size: 18, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "           │  • Sales Dash   │                              │ • Ad-hoc      │", size: 18, font: "Courier New", color: "666666" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "           │  • Exec Dash    │                              │ • Power Users │", size: 18, font: "Courier New", color: "666666" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "           │  • AI Insights  │                              │               │", size: 18, font: "Courier New", color: "666666" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "           └────────┬────────┘                              └───────────────┘", size: 18, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "                    │", size: 18, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "           ┌────────▼────────┐", size: 18, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "           │  EMAIL DIGESTS  │", size: 18, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
                      children: [new TextRun({ text: "           └─────────────────┘", size: 18, font: "Courier New", color: "333333" })] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 300 } }),

        // Component descriptions table
        new Table({
          columnWidths: [2500, 6860],
          rows: [
            new TableRow({
              children: [
                headerCell("Component", 2500),
                headerCell("Description", 6860)
              ]
            }),
            new TableRow({
              children: [
                dataCell("ERP Database", 2500, { bold: true }),
                dataCell("Your existing ERP system - the source of truth for orders, quotations, customers, and products", 6860)
              ]
            }),
            new TableRow({
              children: [
                dataCell("ETL Pipeline", 2500, { bold: true, shading: LIGHT_BG }),
                dataCell("Automated Python-based extraction running nightly at 2 AM, transforming and loading data to analytics database", 6860, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("Analytics Database", 2500, { bold: true }),
                dataCell("Cloud-hosted PostgreSQL optimized for reporting with pre-computed aggregations for fast queries", 6860)
              ]
            }),
            new TableRow({
              children: [
                dataCell("Custom Platform", 2500, { bold: true, shading: LIGHT_BG }),
                dataCell("Primary user interface with Sales Dashboard, Executive Dashboard, AI-powered insights, and report generation", 6860, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("Metabase", 2500, { bold: true }),
                dataCell("Rapid prototyping environment where tech team collaborates with stakeholders to iterate on visualization designs before implementing them in the custom platform", 6860)
              ]
            }),
            new TableRow({
              children: [
                dataCell("Email Digests", 2500, { bold: true, shading: LIGHT_BG }),
                dataCell("Automated daily/weekly PDF summaries delivered to configured stakeholders", 6860, { shading: LIGHT_BG })
              ]
            })
          ]
        }),

        // ==================== METABASE PROTOTYPING WORKFLOW ====================
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Rapid Visualization Prototyping with Metabase")] }),

        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "A key advantage of this architecture is the ability to quickly iterate on visualization designs before committing to custom development. Metabase serves as a collaborative sandbox where your tech team and stakeholders can experiment together.", size: 22, font: "Arial" })]
        }),

        // Prototyping workflow diagram
        new Table({
          columnWidths: [9360],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 2, color: SECONDARY_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 2, color: SECONDARY_COLOR }, left: { style: BorderStyle.SINGLE, size: 2, color: SECONDARY_COLOR }, right: { style: BorderStyle.SINGLE, size: 2, color: SECONDARY_COLOR } },
                  shading: { fill: "F0F9FA", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
                      children: [new TextRun({ text: "VISUALIZATION ITERATION WORKFLOW", bold: true, size: 22, color: SECONDARY_COLOR, font: "Arial" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 },
                      children: [new TextRun({ text: "┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐", size: 16, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "│  PROTOTYPE  │ ───► │   REVIEW    │ ───► │   REFINE    │ ───► │  IMPLEMENT  │", size: 16, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "│  in Metabase│      │   with Team │      │   Iterate   │      │  in Platform│", size: 16, font: "Courier New", color: "666666" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 },
                      children: [new TextRun({ text: "└─────────────┘      └─────────────┘      └──────┬──────┘      └─────────────┘", size: 16, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "                                                │", size: 16, font: "Courier New", color: "333333" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "                                                └──────────────────┘", size: 16, font: "Courier New", color: "999999" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
                      children: [new TextRun({ text: "                                                 (repeat as needed)", size: 14, font: "Arial", color: "999999", italics: true })] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 250 } }),
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("How It Works")] }),

        new Paragraph({ numbering: { reference: "benefits-list", level: 0 }, spacing: { after: 80 },
          children: [
            new TextRun({ text: "Quick Prototyping: ", bold: true, size: 22, font: "Arial" }),
            new TextRun({ text: "Tech team creates initial chart concepts in Metabase within minutes—no coding required", size: 22, font: "Arial" })
          ] }),
        new Paragraph({ numbering: { reference: "benefits-list", level: 0 }, spacing: { after: 80 },
          children: [
            new TextRun({ text: "Stakeholder Collaboration: ", bold: true, size: 22, font: "Arial" }),
            new TextRun({ text: "Sales managers and executives review live visualizations and provide immediate feedback", size: 22, font: "Arial" })
          ] }),
        new Paragraph({ numbering: { reference: "benefits-list", level: 0 }, spacing: { after: 80 },
          children: [
            new TextRun({ text: "Rapid Iteration: ", bold: true, size: 22, font: "Arial" }),
            new TextRun({ text: "Try different chart types, filters, and layouts until the visualization tells the right story", size: 22, font: "Arial" })
          ] }),
        new Paragraph({ numbering: { reference: "benefits-list", level: 0 }, spacing: { after: 80 },
          children: [
            new TextRun({ text: "Validated Implementation: ", bold: true, size: 22, font: "Arial" }),
            new TextRun({ text: "Only approved, stakeholder-validated designs get built into the custom platform", size: 22, font: "Arial" })
          ] }),
        new Paragraph({ numbering: { reference: "benefits-list", level: 0 }, spacing: { after: 200 },
          children: [
            new TextRun({ text: "Reduced Rework: ", bold: true, size: 22, font: "Arial" }),
            new TextRun({ text: "Catch misalignments early in low-cost prototyping phase, not after custom development", size: 22, font: "Arial" })
          ] }),

        new Paragraph({
          spacing: { before: 100, after: 200 },
          shading: { fill: "FFF8E8", type: ShadingType.CLEAR },
          children: [new TextRun({ text: "This approach ensures every visualization in the final platform has been tested and approved by actual users—saving development time and ensuring the dashboards truly meet business needs.", size: 22, font: "Arial", italics: true })]
        }),

        // ==================== DELIVERABLES ====================
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Deliverables")] }),

        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: "The following deliverables will be provided as part of this engagement:", size: 22, font: "Arial" })]
        }),

        new Table({
          columnWidths: [600, 2400, 6360],
          rows: [
            new TableRow({
              children: [
                headerCell("#", 600),
                headerCell("Deliverable", 2400),
                headerCell("Description", 6360)
              ]
            }),
            new TableRow({
              children: [
                dataCell("1", 600, { align: AlignmentType.CENTER }),
                dataCell("ETL Pipeline", 2400, { bold: true }),
                dataCell("Automated Python-based extraction from ERP, data transformation, and loading to analytics database. Runs nightly with error logging and validation.", 6360)
              ]
            }),
            new TableRow({
              children: [
                dataCell("2", 600, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("Analytics Database", 2400, { bold: true, shading: LIGHT_BG }),
                dataCell("Cloud-hosted PostgreSQL with optimized schema for reporting—orders, quotations, customers, products, inventory, targets, forecasts.", 6360, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("3", 600, { align: AlignmentType.CENTER }),
                dataCell("Sales Team Dashboard", 2400, { bold: true }),
                dataCell("Interactive web dashboard showing pipeline status, quotation tracking, order trends, conversion rates, and salesperson performance.", 6360)
              ]
            }),
            new TableRow({
              children: [
                dataCell("4", 600, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("Executive Dashboard", 2400, { bold: true, shading: LIGHT_BG }),
                dataCell("High-level KPI summary with AI-generated insights, trend analysis, and key alerts. Mobile-friendly design.", 6360, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("5", 600, { align: AlignmentType.CENTER }),
                dataCell("Report Generator", 2400, { bold: true }),
                dataCell("On-demand PDF report generation with export capabilities.", 6360)
              ]
            }),
            new TableRow({
              children: [
                dataCell("6", 600, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("Scheduled Email Digests", 2400, { bold: true, shading: LIGHT_BG }),
                dataCell("Automated daily/weekly email summaries delivered to configured recipients.", 6360, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("7", 600, { align: AlignmentType.CENTER }),
                dataCell("Metabase Instance", 2400, { bold: true }),
                dataCell("Pre-configured rapid prototyping environment for tech team to collaborate with stakeholders, quickly iterate through different chart types and visualizations, and validate designs before implementing in the custom platform.", 6360)
              ]
            }),
            new TableRow({
              children: [
                dataCell("8", 600, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("Documentation & Training", 2400, { bold: true, shading: LIGHT_BG }),
                dataCell("User guides, admin documentation, and hands-on training session.", 6360, { shading: LIGHT_BG })
              ]
            })
          ]
        }),

        // ==================== PROJECT MILESTONES ====================
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Project Milestones")] }),

        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: "The project will be executed in 8 milestones over 10 weeks:", size: 22, font: "Arial" })]
        }),

        new Table({
          columnWidths: [1200, 3200, 1800, 1300, 1860],
          rows: [
            new TableRow({
              children: [
                headerCell("Milestone", 1200),
                headerCell("Deliverable", 3200),
                headerCell("Duration", 1800),
                headerCell("Man Days", 1300),
                headerCell("Amount (RM)", 1860)
              ]
            }),
            new TableRow({
              children: [
                dataCell("M1", 1200, { align: AlignmentType.CENTER, bold: true }),
                dataCell("Project Kickoff", 3200),
                dataCell("1 week", 1800, { align: AlignmentType.CENTER }),
                dataCell("5", 1300, { align: AlignmentType.CENTER }),
                dataCell("8,000", 1860, { align: AlignmentType.RIGHT })
              ]
            }),
            new TableRow({
              children: [
                dataCell("M2", 1200, { align: AlignmentType.CENTER, bold: true, shading: LIGHT_BG }),
                dataCell("Data Pipeline Live", 3200, { shading: LIGHT_BG }),
                dataCell("2 weeks", 1800, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("10", 1300, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("16,000", 1860, { align: AlignmentType.RIGHT, shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("M3", 1200, { align: AlignmentType.CENTER, bold: true }),
                dataCell("Sales Dashboard Ready", 3200),
                dataCell("2 weeks", 1800, { align: AlignmentType.CENTER }),
                dataCell("10", 1300, { align: AlignmentType.CENTER }),
                dataCell("16,000", 1860, { align: AlignmentType.RIGHT })
              ]
            }),
            new TableRow({
              children: [
                dataCell("M4", 1200, { align: AlignmentType.CENTER, bold: true, shading: LIGHT_BG }),
                dataCell("Executive Dashboard Ready", 3200, { shading: LIGHT_BG }),
                dataCell("1.5 weeks", 1800, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("8", 1300, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("12,800", 1860, { align: AlignmentType.RIGHT, shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("M5", 1200, { align: AlignmentType.CENTER, bold: true }),
                dataCell("Reporting Enabled", 3200),
                dataCell("1 week", 1800, { align: AlignmentType.CENTER }),
                dataCell("5", 1300, { align: AlignmentType.CENTER }),
                dataCell("8,000", 1860, { align: AlignmentType.RIGHT })
              ]
            }),
            new TableRow({
              children: [
                dataCell("M6", 1200, { align: AlignmentType.CENTER, bold: true, shading: LIGHT_BG }),
                dataCell("Metabase Available", 3200, { shading: LIGHT_BG }),
                dataCell("0.5 week", 1800, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("3", 1300, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("4,800", 1860, { align: AlignmentType.RIGHT, shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("M7", 1200, { align: AlignmentType.CENTER, bold: true }),
                dataCell("User Acceptance Complete", 3200),
                dataCell("1 week", 1800, { align: AlignmentType.CENTER }),
                dataCell("5", 1300, { align: AlignmentType.CENTER }),
                dataCell("8,000", 1860, { align: AlignmentType.RIGHT })
              ]
            }),
            new TableRow({
              children: [
                dataCell("M8", 1200, { align: AlignmentType.CENTER, bold: true, shading: LIGHT_BG }),
                dataCell("Go-Live & Handover", 3200, { shading: LIGHT_BG }),
                dataCell("1 week", 1800, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("4", 1300, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("6,400", 1860, { align: AlignmentType.RIGHT, shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 1200, type: WidthType.DXA }, shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 },
                    children: [new TextRun({ text: "TOTAL", bold: true, color: "FFFFFF", size: 22, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA }, shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [] })] }),
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 },
                    children: [new TextRun({ text: "10 weeks", bold: true, color: "FFFFFF", size: 22, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 1300, type: WidthType.DXA }, shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 },
                    children: [new TextRun({ text: "50", bold: true, color: "FFFFFF", size: 22, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 1860, type: WidthType.DXA }, shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 80, after: 80 },
                    children: [new TextRun({ text: "80,000", bold: true, color: "FFFFFF", size: 22, font: "Arial" })] })] })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Timeline Visualization")] }),

        // Timeline chart as ASCII table
        new Table({
          columnWidths: [9360],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  shading: { fill: "FAFAFA", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ spacing: { before: 150, after: 100 },
                      children: [new TextRun({ text: "Week:   1      2      3      4      5      6      7      8      9     10", size: 18, font: "Courier New", color: "666666" })] }),
                    new Paragraph({ children: [new TextRun({ text: "        ├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤", size: 18, font: "Courier New", color: "CCCCCC" })] }),
                    new Paragraph({ children: [new TextRun({ text: "   M1   ██████", size: 18, font: "Courier New", color: PRIMARY_COLOR })] }),
                    new Paragraph({ children: [new TextRun({ text: "   M2          ████████████████", size: 18, font: "Courier New", color: SECONDARY_COLOR })] }),
                    new Paragraph({ children: [new TextRun({ text: "   M3                         ████████████████", size: 18, font: "Courier New", color: PRIMARY_COLOR })] }),
                    new Paragraph({ children: [new TextRun({ text: "   M4                                        ██████████", size: 18, font: "Courier New", color: SECONDARY_COLOR })] }),
                    new Paragraph({ children: [new TextRun({ text: "   M5                                                  ██████", size: 18, font: "Courier New", color: PRIMARY_COLOR })] }),
                    new Paragraph({ children: [new TextRun({ text: "   M6                                                       ███", size: 18, font: "Courier New", color: SECONDARY_COLOR })] }),
                    new Paragraph({ children: [new TextRun({ text: "   M7                                                          ██████", size: 18, font: "Courier New", color: PRIMARY_COLOR })] }),
                    new Paragraph({ spacing: { after: 100 },
                      children: [new TextRun({ text: "   M8                                                                 ██████ ►GO-LIVE", size: 18, font: "Courier New", color: ACCENT_COLOR })] })
                  ]
                })
              ]
            })
          ]
        }),

        // ==================== INVESTMENT ====================
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Investment")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Project Investment")] }),

        // Investment summary box
        new Table({
          columnWidths: [9360],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 3, color: ACCENT_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT_COLOR }, left: { style: BorderStyle.SINGLE, size: 3, color: ACCENT_COLOR }, right: { style: BorderStyle.SINGLE, size: 3, color: ACCENT_COLOR } },
                  shading: { fill: "FFF8E8", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
                      children: [new TextRun({ text: "Total Project Investment", size: 24, color: "666666", font: "Arial" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
                      children: [new TextRun({ text: "RM 80,000", size: 56, bold: true, color: PRIMARY_COLOR, font: "Arial" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
                      children: [new TextRun({ text: "50 man days  •  10 weeks  •  Rate: RM 1,600/day", size: 20, color: "666666", font: "Arial" })] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Payment Schedule")] }),

        new Table({
          columnWidths: [2800, 1200, 1800, 3560],
          rows: [
            new TableRow({
              children: [
                headerCell("Milestone", 2800),
                headerCell("%", 1200),
                headerCell("Amount (RM)", 1800),
                headerCell("Trigger", 3560)
              ]
            }),
            new TableRow({
              children: [
                dataCell("Contract Signing", 2800, { bold: true }),
                dataCell("30%", 1200, { align: AlignmentType.CENTER }),
                dataCell("24,000", 1800, { align: AlignmentType.RIGHT }),
                dataCell("Upon agreement execution", 3560)
              ]
            }),
            new TableRow({
              children: [
                dataCell("M2: Data Pipeline Live", 2800, { bold: true, shading: LIGHT_BG }),
                dataCell("20%", 1200, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("16,000", 1800, { align: AlignmentType.RIGHT, shading: LIGHT_BG }),
                dataCell("ETL operational", 3560, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("M4: Dashboards Delivered", 2800, { bold: true }),
                dataCell("25%", 1200, { align: AlignmentType.CENTER }),
                dataCell("20,000", 1800, { align: AlignmentType.RIGHT }),
                dataCell("Both dashboards delivered", 3560)
              ]
            }),
            new TableRow({
              children: [
                dataCell("M8: Go-Live & Handover", 2800, { bold: true, shading: LIGHT_BG }),
                dataCell("25%", 1200, { align: AlignmentType.CENTER, shading: LIGHT_BG }),
                dataCell("20,000", 1800, { align: AlignmentType.RIGHT, shading: LIGHT_BG }),
                dataCell("UAT sign-off", 3560, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  children: [new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Total", bold: true, color: "FFFFFF", size: 22, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 1200, type: WidthType.DXA }, shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "100%", bold: true, color: "FFFFFF", size: 22, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "80,000", bold: true, color: "FFFFFF", size: 22, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3560, type: WidthType.DXA }, shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [] })] })
              ]
            })
          ]
        }),

        // ==================== CLIENT-BORNE COSTS ====================
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Client-Borne Costs (Separate from Project Fee)")] }),

        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "The following ongoing costs are to be borne by the client directly:", size: 22, font: "Arial" })]
        }),

        new Table({
          columnWidths: [3500, 2500, 3360],
          rows: [
            new TableRow({
              children: [
                headerCell("Item", 3500),
                headerCell("Estimated Cost", 2500),
                headerCell("Notes", 3360)
              ]
            }),
            new TableRow({
              children: [
                dataCell("Metabase License", 3500, { bold: true }),
                dataCell("", 2500),
                dataCell("", 3360)
              ]
            }),
            new TableRow({
              children: [
                dataCell("   • Open Source", 3500, { shading: LIGHT_BG }),
                dataCell("Free", 2500, { shading: LIGHT_BG }),
                dataCell("Recommended for internal use", 3360, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("   • Pro (if SSO/embedding needed)", 3500),
                dataCell("~RM 2,200/month", 2500),
                dataCell("Required for embedded charts", 3360)
              ]
            }),
            new TableRow({
              children: [
                dataCell("Cloud Infrastructure", 3500, { bold: true, shading: LIGHT_BG }),
                dataCell("", 2500, { shading: LIGHT_BG }),
                dataCell("", 3360, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("   • PostgreSQL Database", 3500),
                dataCell("RM 200 - 600/month", 2500),
                dataCell("Based on usage", 3360)
              ]
            }),
            new TableRow({
              children: [
                dataCell("   • Application Hosting", 3500, { shading: LIGHT_BG }),
                dataCell("RM 100 - 250/month", 2500, { shading: LIGHT_BG }),
                dataCell("Next.js hosting", 3360, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("   • Email Service", 3500),
                dataCell("RM 0 - 100/month", 2500),
                dataCell("Based on volume", 3360)
              ]
            }),
            new TableRow({
              children: [
                dataCell("   • AI API (OpenAI)", 3500, { shading: LIGHT_BG }),
                dataCell("RM 50 - 200/month", 2500, { shading: LIGHT_BG }),
                dataCell("For insights generation", 3360, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 3500, type: WidthType.DXA }, shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
                  children: [new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Estimated Monthly Total", bold: true, size: 22, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2500, type: WidthType.DXA }, shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
                  children: [new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "RM 350 - 1,150", bold: true, size: 22, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
                  children: [new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Excluding Metabase Pro", size: 20, color: "666666", font: "Arial" })] })] })
              ]
            })
          ]
        }),

        // ==================== NEXT STEPS ====================
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Next Steps")] }),

        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: "To proceed with this engagement, please complete the following:", size: 22, font: "Arial" })]
        }),

        new Table({
          columnWidths: [600, 3000, 5760],
          rows: [
            new TableRow({
              children: [
                headerCell("Step", 600),
                headerCell("Action", 3000),
                headerCell("Details", 5760)
              ]
            }),
            new TableRow({
              children: [
                dataCell("1", 600, { align: AlignmentType.CENTER, bold: true }),
                dataCell("Review & Approve", 3000, { bold: true }),
                dataCell("Review this proposal and confirm acceptance of scope, timeline, and investment", 5760)
              ]
            }),
            new TableRow({
              children: [
                dataCell("2", 600, { align: AlignmentType.CENTER, bold: true, shading: LIGHT_BG }),
                dataCell("Sign Agreement", 3000, { bold: true, shading: LIGHT_BG }),
                dataCell("Execute the service agreement and submit initial payment (30%)", 5760, { shading: LIGHT_BG })
              ]
            }),
            new TableRow({
              children: [
                dataCell("3", 600, { align: AlignmentType.CENTER, bold: true }),
                dataCell("Provide Access", 3000, { bold: true }),
                dataCell("Grant database access to ERP system and provide sample data documentation", 5760)
              ]
            }),
            new TableRow({
              children: [
                dataCell("4", 600, { align: AlignmentType.CENTER, bold: true, shading: LIGHT_BG }),
                dataCell("Kickoff Meeting", 3000, { bold: true, shading: LIGHT_BG }),
                dataCell("Schedule project kickoff to align on requirements and communication cadence", 5760, { shading: LIGHT_BG })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 600 } }),

        // Contact box
        new Table({
          columnWidths: [9360],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY_COLOR }, left: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY_COLOR }, right: { style: BorderStyle.SINGLE, size: 2, color: PRIMARY_COLOR } },
                  shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 150 },
                      children: [new TextRun({ text: "Questions? Let's Talk.", size: 28, bold: true, color: PRIMARY_COLOR, font: "Arial" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
                      children: [new TextRun({ text: "Contact: [Your Name]", size: 22, font: "Arial" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
                      children: [new TextRun({ text: "Email: [your.email@company.com]", size: 22, font: "Arial" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
                      children: [new TextRun({ text: "Phone: [+60 XX-XXX XXXX]", size: 22, font: "Arial" })] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Thank you for considering this proposal.", size: 24, italics: true, color: "666666", font: "Arial" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "We look forward to partnering with you.", size: 24, italics: true, color: "666666", font: "Arial" })]
        })
      ]
    }
  ]
});

// Generate the document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("docs/proposals/Data-Visualization-Platform-Proposal.docx", buffer);
  console.log("Proposal document generated: docs/proposals/Data-Visualization-Platform-Proposal.docx");
});
