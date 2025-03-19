'use client';

import React, { useEffect, useState } from 'react';

interface Manifest {
  name: string;
  version: string;
  description: string;
  manifest_version: number;
  action: {
    default_popup: string;
    default_title: string;
  };
  permissions: string[];
  icons: {
    [key: string]: string;
  };
}

export default function ExtensionPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {

    fetch('http://localhost:8000/manifest.json')
      .then((response) => response.json())
      .then((data) => setManifest(data))
      .catch((error) => console.error('Error fetching manifest:', error));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Perspective AI Extension</h1>
      <p>This is the new extension page integrated within the existing project.</p>
      {manifest ? (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Manifest Details:</h2>
          <pre className="bg-gray-200 p-4 rounded mt-2">
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </div>
      ) : (
        <p>Loading manifest...</p>
      )}
    </div>
  );
}
