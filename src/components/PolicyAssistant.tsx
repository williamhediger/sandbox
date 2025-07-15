'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

export default function PolicyAssistant() {
  const [query, setQuery] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['policyQuery', query],
    queryFn: async () => {
      if (!query) return null;
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch response');
      }
      return response.json();
    },
    enabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      refetch();
    }
  };

  return (
    <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center justify-center mb-6">
        <Image src="/logo.png" alt="Company Logo" width={150} height={40} className="h-10 w-auto" />
      </div>
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Policy Assistant</h1>
      <p className="text-center text-gray-500 mb-8">Ask questions about company policies</p>
      <div className="mb-6">
        {isLoading ? (
          <div className="text-center">
            <span className="loading-spinner" />
            <p className="mt-2 text-gray-600">Processing your query...</p>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">
            Error: {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        ) : data ? (
          <div className="answer-container p-6 bg-gray-100 rounded-lg text-gray-800">
            <p>{data.answer}</p>
          </div>
        ) : (
          <p className="text-center text-gray-500">Enter a question to get started.</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="input-container flex-1">
          <input
            type="text"
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder=" "
            className="w-full"
          />
          <label htmlFor="query">Ask about company policies...</label>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}