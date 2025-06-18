import React from 'react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto">
        <Link href="/" passHref>
          <h1 className="text-3xl font-headline cursor-pointer">DesiBae</h1>
        </Link>
      </div>
    </header>
  );
}
