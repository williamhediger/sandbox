import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RetrievalQAChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

async function fetchFileText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch file: " + url);
  return await res.text();
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    const domain = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const indexRes = await fetch(`${domain}/policy_docs/index.json`);
    const fileList: string[] = await indexRes.json();

    const docs: string[] = [];
    for (const file of fileList) {
      const fileUrl = `${domain}/policy_docs/${file}`;
      const content = await fetchFileText(fileUrl);
      if (content.trim()) docs.push(content);
    }

    if (!docs.length) {
      return NextResponse.json({ answer: "No usable documents found." });
    }

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splitDocs = await splitter.createDocuments(docs);
    const store = await MemoryVectorStore.fromDocuments(splitDocs, new OpenAIEmbeddings());
    const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });

    const chain = RetrievalQAChain.fromLLM(llm, store.asRetriever(), {
      returnSourceDocuments: false,
    });

    const result = await chain.call({ query: question });
    return NextResponse.json({ answer: result.text });
  } catch (err) {
    console.error("Fatal error in /api/ask:", err);
    return NextResponse.json({ answer: "An error occurred processing your request." }, { status: 500 });
  }
}
