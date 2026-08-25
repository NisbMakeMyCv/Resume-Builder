import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resumeData = body.resumeData;

    if (!resumeData) {
      return NextResponse.json({ error: "resumeData is required" }, { status: 400 });
    }

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      HeadingLevel,
      AlignmentType,
      BorderStyle,
      Table,
      TableRow,
      TableCell,
      WidthType,
      VerticalAlign,
      ShadingType,
    } = await import("docx");

    const { header, education, experience, skills, projects } = resumeData;

    const children: any[] = [];

    // ── HEADER ──────────────────────────────────────────────────────────────
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: header.fullName || "Your Name",
            bold: true,
            size: 36, // 18pt
            font: "Calibri",
          }),
        ],
        spacing: { after: 80 },
      })
    );

    // Contact line
    const contactParts: string[] = [];
    if (header.phone) contactParts.push(header.phone);
    if (header.email) contactParts.push(header.email);
    if (header.location) contactParts.push(header.location);
    if (header.links?.linkedin) contactParts.push(header.links.linkedin);
    if (header.links?.github) contactParts.push(header.links.github);
    if (header.links?.portfolio) contactParts.push(header.links.portfolio);

    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: contactParts.join("  |  "),
              size: 18, // 9pt
              color: "444444",
              font: "Calibri",
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }

    const sectionHeading = (title: string) =>
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22, font: "Calibri", color: "1a1a1a" })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "222222" } },
        spacing: { before: 240, after: 80 },
      });

    const bullet = (text: string) =>
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text, size: 20, font: "Calibri" })],
        spacing: { after: 40 },
      });

    // ── EDUCATION ───────────────────────────────────────────────────────────
    if (education && education.length > 0) {
      children.push(sectionHeading("Education"));
      for (const edu of education) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.institution || "", bold: true, size: 22, font: "Calibri" }),
              new TextRun({
                text: `  ${edu.startDate || ""}${edu.endDate ? " – " + edu.endDate : ""}`,
                size: 20, color: "555555", font: "Calibri",
              }),
            ],
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `${edu.degree || ""}${edu.branch ? " — " + edu.branch : ""}`, italics: true, size: 20, font: "Calibri" }),
              ...(edu.cgpa ? [new TextRun({ text: `   GPA: ${edu.cgpa}`, size: 20, color: "555555", font: "Calibri" })] : []),
            ],
            spacing: { after: 80 },
          })
        );
      }
    }

    // ── EXPERIENCE ──────────────────────────────────────────────────────────
    if (experience && experience.length > 0) {
      children.push(sectionHeading("Experience"));
      for (const exp of experience) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.company || "", bold: true, size: 22, font: "Calibri" }),
              new TextRun({
                text: `  ${exp.startDate || ""}${exp.endDate ? " – " + exp.endDate : " – Present"}`,
                size: 20, color: "555555", font: "Calibri",
              }),
            ],
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [new TextRun({ text: exp.position || exp.designation || "", italics: true, bold: true, size: 20, font: "Calibri" })],
            spacing: { after: 40 },
          })
        );
        // Bullets
        const bullets: string[] = Array.isArray(exp.bullets)
          ? exp.bullets
          : (exp.description || "").split("\n").filter(Boolean);
        for (const b of bullets) {
          if (b.trim()) children.push(bullet(b.replace(/^[-•]\s*/, "")));
        }
        children.push(new Paragraph({ spacing: { after: 60 } }));
      }
    }

    // ── PROJECTS ────────────────────────────────────────────────────────────
    if (projects && projects.length > 0) {
      children.push(sectionHeading("Projects"));
      for (const proj of projects) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: proj.title || proj.name || "", bold: true, size: 22, font: "Calibri" }),
              ...(proj.link || proj.githubLink
                ? [new TextRun({ text: `  |  ${proj.link || proj.githubLink}`, size: 18, color: "0066cc", font: "Calibri" })]
                : []),
            ],
            spacing: { after: 40 },
          })
        );
        const bullets: string[] = Array.isArray(proj.bullets)
          ? proj.bullets
          : (proj.description || "").split("\n").filter(Boolean);
        for (const b of bullets) {
          if (b.trim()) children.push(bullet(b.replace(/^[-•]\s*/, "")));
        }
        children.push(new Paragraph({ spacing: { after: 60 } }));
      }
    }

    // ── SKILLS ──────────────────────────────────────────────────────────────
    if (skills && skills.length > 0) {
      children.push(sectionHeading("Skills"));
      for (const group of skills) {
        const label = group.category || group.label || "";
        const items: string = Array.isArray(group.items)
          ? group.items.join(", ")
          : (group.skills || "");
        children.push(
          new Paragraph({
            children: [
              ...(label ? [new TextRun({ text: `${label}: `, bold: true, size: 20, font: "Calibri" })] : []),
              new TextRun({ text: items, size: 20, font: "Calibri" }),
            ],
            spacing: { after: 60 },
          })
        );
      }
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: "Calibri", size: 20 },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, bottom: 720, left: 864, right: 864 }, // 1" top/bottom, 0.75" sides
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="resume.docx"',
      },
    });
  } catch (error) {
    console.error("DOCX Export Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
