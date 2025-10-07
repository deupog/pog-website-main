import React from "react";
import { FaRegCalendarAlt } from "react-icons/fa";

// URL'leri otomatik algılayıp linke çeviren fonksiyon
const autoDetectUrls = (text: string): string => {
  if (!text) return '';
  
  // URL pattern'leri
  const urlPattern = /(https?:\/\/[^\s<]+)/g;
  const formsPattern = /(forms\.gle\/[^\s<]+)/g;
  const shortUrlPattern = /(bit\.ly\/[^\s<]+|tinyurl\.com\/[^\s<]+|t\.ly\/[^\s<]+)/g;
  
  let processedText = text;
  
  // Tüm URL pattern'lerini işle
  processedText = processedText.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>');
  processedText = processedText.replace(formsPattern, '<a href="https://$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>');
  processedText = processedText.replace(shortUrlPattern, '<a href="https://$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>');
  
  return processedText;
};

// HTML tag'lerini temizleyen fonksiyon (truncate için)
const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

// HTML içeriğini truncate eden fonksiyon
const truncateHtmlContent = (html: string, length: number): string => {
  const plainText = stripHtml(html);
  if (plainText.length <= length) return html;
  
  // HTML'i koruyarak truncate et
  let truncated = '';
  let textCount = 0;
  let inTag = false;
  let tagContent = '';
  
  for (let i = 0; i < html.length; i++) {
    const char = html[i];
    
    if (char === '<') {
      inTag = true;
      tagContent = char;
    } else if (char === '>' && inTag) {
      tagContent += char;
      truncated += tagContent;
      inTag = false;
      tagContent = '';
    } else if (inTag) {
      tagContent += char;
    } else {
      if (textCount < length) {
        truncated += char;
        textCount++;
      } else {
        break;
      }
    }
  }
  
  return truncated + "...";
};

export const EventBox: React.FC<{
  event: EventData;
  isSelected: boolean;
  onClick: () => void;
  onClose: () => void;
  isHidden: boolean;
}> = ({ event, isSelected, onClick, onClose, isHidden }) => {
  
  // Content'i işle - URL'leri linke çevir
  const processedContent = autoDetectUrls(event.content);

  return (
    <div
      className={`relative cursor-pointer border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-500 ease-in-out ${
        isSelected ? "w-full h-auto py-10 px-10" : "w-full h-20 overflow-hidden"
      } ${isHidden ? "hidden" : "block"} p-3`}
      onClick={!isSelected ? onClick : undefined} 
    >
      
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation(); 
            onClose();
          }}
          className="absolute top-2 right-2 bg-[#1a264e] dark:bg-white text-white dark:text-gray-900 p-2 w-8 h-8 flex items-center justify-center rounded-full shadow-lg transform transition-transform duration-300 ease-in-out hover:scale-105 hover:bg-transparent dark:hover:bg-transparent hover:border-2 border-gray-900 hover:text-gray-900 dark:border-white dark:hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      )}

      <div className="flex justify-between md:justify-start items-center space-x-6">
        <h3 className="text-sm md:text-lg font-semibold text-black dark:text-white">
          {event.header}
        </h3>
        <div className="flex items-center space-x-1">
          <FaRegCalendarAlt className="text-gray-500 dark:text-gray-400" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {event.date}
          </p>
        </div>
      </div>
      
      <div
        className={`mt-1 md:mt-2 text-gray-600 dark:text-gray-300 text-sm md:text-base ${
          !isSelected ? "line-clamp-2" : ""
        }`}
        dangerouslySetInnerHTML={{
          __html: isSelected 
            ? processedContent 
            : truncateHtmlContent(processedContent, 70),
        }}
      />
    </div>
  );
};