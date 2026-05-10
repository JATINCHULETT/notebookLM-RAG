import { NextResponse } from "next/server";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
const formatDocumentsAsString = (documents: any[]) => documents.map((doc) => doc.pageContent).join("\n\n");

export async function POST(req: Request) {
  try {
    const { message, collectionName } = await req.json();

    if (!message || !collectionName) {
      return NextResponse.json({ error: "Message and collectionName are required" }, { status: 400 });
    }

    const qdrantUrl = "https://f0b9bda9-310c-47a4-8e39-cccd02457a82.us-east-2-0.aws.cloud.qdrant.io:6333";
    const qdrantApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6ZGM1ZDkzZDQtNTJlNi00N2Q4LWE3YTItZmVkNGRhMzBkMmU0In0.Wi5S8blFJaUhvsvwT4YTf2IB5Uy4UYjf7SRhaPeSKIo";

    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "gemini-embedding-2",
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: qdrantUrl,
      apiKey: qdrantApiKey,
      collectionName: collectionName,
    });

    const retriever = vectorStore.asRetriever(3);

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
    });

    const prompt = PromptTemplate.fromTemplate(`
      You are an AI assistant analyzing a specific document.
      Use the following pieces of retrieved context to answer the question.
      If the answer is not in the context, explicitly state "I cannot answer this based on the uploaded document."
      Do not use outside knowledge.
      
      Context: {context}
      
      Question: {question}
      
      Answer:
    `);

    const chain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocumentsAsString),
        question: new RunnablePassthrough(),
      },
      prompt,
      model,
      new StringOutputParser(),
    ]);

    const answer = await chain.invoke(message);

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate answer" }, { status: 500 });
  }
}
