import React from 'react';

interface FormattedDescriptionProps {
    text: string | null;
    className?: string;
}

/**
 * FormattedDescription Component
 * 
 * Renders product descriptions with support for:
 * - **bold text** for bold formatting
 * - Ordered lists (1. 2. 3.)
 * - Bullet lists (•)
 * - Line breaks and paragraphs
 */
export default function FormattedDescription({
    text,
    className = ''
}: FormattedDescriptionProps) {
    if (!text) return null;

    // Split into lines and paragraphs
    const paragraphs = text.split('\n\n');

    return (
        <div className={`space-y-4 ${className}`}>
            {paragraphs.map((paragraph, pIdx) => {
                const lines = paragraph.split('\n');

                // Check if this is a list
                const isOrderedList = lines.some(line => /^\d+\./.test(line.trim()));
                const isBulletList = lines.some(line => /^[•·\-\*]/.test(line.trim()));

                if (isOrderedList) {
                    return (
                        <ol key={`list-${pIdx}`} className="list-decimal pl-5 space-y-1">
                            {lines.map((line, lIdx) => {
                                const match = line.match(/^\d+\.\s*(.*)/);
                                const content = match ? match[1] : line;
                                return (
                                    <li key={`item-${lIdx}`} className="text-gray-700">
                                        <ParsedText text={content} />
                                    </li>
                                );
                            })}
                        </ol>
                    );
                }

                if (isBulletList) {
                    return (
                        <ul key={`list-${pIdx}`} className="list-disc pl-5 space-y-1">
                            {lines.map((line, lIdx) => {
                                const content = line.replace(/^[•·\-\*]\s*/, '');
                                return (
                                    <li key={`item-${lIdx}`} className="text-gray-700">
                                        <ParsedText text={content} />
                                    </li>
                                );
                            })}
                        </ul>
                    );
                }

                // Regular paragraph
                return (
                    <p key={`para-${pIdx}`} className="text-gray-700 leading-relaxed">
                        <ParsedText text={paragraph} />
                    </p>
                );
            })}
        </div>
    );
}

/**
 * ParsedText Component
 * 
 * Handles inline formatting:
 * - **bold text** → <strong>bold text</strong>
 */
function ParsedText({ text }: { text: string }) {
    if (!text) return null;

    // Split by bold markers
    const parts = text.split(/(\*\*[^*]+\*\*)/);

    return (
        <>
            {parts.map((part, idx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                        <strong key={idx} className="font-semibold text-gray-900">
                            {part.slice(2, -2)}
                        </strong>
                    );
                }
                return <span key={idx}>{part}</span>;
            })}
        </>
    );
}
