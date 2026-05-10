import { NextResponse } from "next/server";
import "pdf-parse"; // Force Vercel to bundle this dependency
import { v4 as uuidv4 } from "uuid";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let loadedDocs: Document[] = [];

    if (file.name.toLowerCase().endsWith(".pdf")) {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const loader = new PDFLoader(blob, { splitPages: false });
      loadedDocs = await loader.load();
    } else {
      const text = Buffer.from(await file.arrayBuffer()).toString("utf-8");
      loadedDocs = [new Document({ pageContent: text, metadata: { source: file.name } })];
    }

    if (!loadedDocs || loadedDocs.length === 0 || loadedDocs.every(d => !d.pageContent.trim())) {
      return NextResponse.json({ error: "Failed to extract text from file" }, { status: 400 });
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.splitDocuments(loadedDocs);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "gemini-embedding-2", 
    });

    const collectionName = `notebook_${uuidv4().replace(/-/g, "_")}`;

    const qdrantUrl = "https://f0b9bda9-310c-47a4-8e39-cccd02457a82.us-east-2-0.aws.cloud.qdrant.io:6333";
    const qdrantApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6ZGM1ZDkzZDQtNTJlNi00N2Q4LWE3YTItZmVkNGRhMzBkMmU0In0.Wi5S8blFJaUhvsvwT4YTf2IB5Uy4UYjf7SRhaPeSKIo";

    await QdrantVectorStore.fromDocuments(docs, embeddings, {
      url: qdrantUrl,
      apiKey: qdrantApiKey,
      collectionName: collectionName,
    });

    return NextResponse.json({ success: true, collectionName });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process document" }, { status: 500 });
  }
}
