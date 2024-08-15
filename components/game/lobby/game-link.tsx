'use client';

import { Button } from '@/components/ui/button';
import { BanIcon } from 'lucide-react';
import React, { useState } from 'react';

const GameLink = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const gameLink = window.location.href;
    navigator.clipboard.writeText(gameLink);
    console.log('Game link: ', gameLink);
    setCopied(true);
  };

  const handleRemoveCopy = () => {
    navigator.clipboard.writeText('');
    setCopied(false);
  };

  return (
    <div className="flex flex-row items-center gap-x-2 w-full">
      <Button
        className={`${copied ? 'opacity-50' : ''}`}
        onClick={handleCopyLink}
      >
        {copied ? 'Copied' : 'Copy Game Link'}
      </Button>
      {copied && (
        <Button onClick={() => handleRemoveCopy()} variant="ghost" size="icon">
          <BanIcon />
        </Button>
      )}
    </div>
  );
};

export default GameLink;
