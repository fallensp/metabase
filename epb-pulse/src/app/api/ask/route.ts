import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateSQL, formatAnswer } from "@/lib/llm/text-to-sql";
import { prisma } from "@/lib/db";

const AskSchema = z.object({
  question: z
    .string()
    .min(5, "Question too short")
    .max(500, "Question too long"),
  includeSQL: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = AskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { question, includeSQL } = result.data;

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          answer:
            "AI Q&A is not configured. Please add your OpenAI API key to the environment variables.",
          visualization: null,
          sql: null,
        },
        { status: 200 }
      );
    }

    // Generate SQL from question
    const sqlResult = await generateSQL(question);

    // Execute the query with timeout
    const startTime = Date.now();
    let data: Record<string, unknown>[];

    try {
      // Clean up the SQL and add limit if not present
      let safeSQL = sqlResult.sql.replace(/;\s*$/, "").trim();

      // Only add LIMIT if not already present
      if (!/\bLIMIT\s+\d+/i.test(safeSQL)) {
        safeSQL = `${safeSQL} LIMIT 100`;
      }

      data = await prisma.$queryRawUnsafe(safeSQL);
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        {
          answer:
            "Sorry, there was an error executing the query. Please try rephrasing your question.",
          visualization: null,
          sql: includeSQL ? sqlResult.sql : null,
        },
        { status: 200 }
      );
    }

    const executionTime = Date.now() - startTime;

    // Format the answer
    const answer = formatAnswer(
      sqlResult.explanation,
      data as Record<string, unknown>[],
      sqlResult.visualizationType
    );

    // Serialize BigInt values to strings
    const serializedData = (data as Record<string, unknown>[]).map((row) => {
      const newRow: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === "bigint") {
          newRow[key] = Number(value);
        } else if (value instanceof Date) {
          newRow[key] = value.toISOString().split("T")[0];
        } else if (typeof value === "object" && value !== null) {
          // Handle Decimal type from Prisma
          newRow[key] = Number(value);
        } else {
          newRow[key] = value;
        }
      }
      return newRow;
    });

    return NextResponse.json({
      answer,
      visualization:
        serializedData.length > 0
          ? {
              type: sqlResult.visualizationType,
              data: serializedData,
            }
          : null,
      sql: includeSQL ? sqlResult.sql : null,
      executionTimeMs: executionTime,
    });
  } catch (error) {
    console.error("Ask API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        answer: `Sorry, I encountered an error: ${errorMessage}`,
        visualization: null,
        sql: null,
      },
      { status: 200 }
    );
  }
}
