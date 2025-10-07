import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notionSecret = process.env.NOTION_SECRET;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

const notion = new Client({ auth: notionSecret });

export type EventData = {
  header: string;
  content: string;
  date: string;
};

// Type guard - PageObjectResponse kontrolü
const isPageObjectResponse = (result: any): result is PageObjectResponse => {
  return result.object === 'page' && result.properties !== undefined;
};

// Content temizleme fonksiyonu
const cleanContent = (richText: any[]): string => {
  if (!richText || richText.length === 0) return '';

  const processedContent = richText.map(block => {
    const text = block.plain_text || block.text?.content || '';
    
    // LINK KONTROLÜ
    const linkUrl = block.href || block.text?.link?.url;
    
    if (linkUrl) {
      return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${text}</a>`;
    }
    
    return text;
  }).join('');

  return processedContent.trim().replace(/\n+/g, "<br />");
};

export const fetchEvents = async (): Promise<EventData[]> => {
  if (!notionSecret || !notionDatabaseId) {
    throw new Error("Notion secret or database id is missing");
  }

  const query = await notion.databases.query({
    database_id: notionDatabaseId,
  });

  // DEBUG: Type'ları kontrol et
  console.log('=== NOTION API RESPONSE TYPES ===');
  console.log('Results count:', query.results.length);
  query.results.forEach((result, index) => {
    console.log(`Result ${index} type:`, result.object);
    console.log(`Result ${index} has properties:`, 'properties' in result);
  });

  const rowsStructured: EventData[] = query.results
    .filter(isPageObjectResponse) // Sadece PageObjectResponse'ları filtrele
    .map((result) => {
      const properties = result.properties;
      
      // Type-safe property erişimi
      const headerProperty = properties.header as any;
      const contentProperty = properties.content as any;
      const dateProperty = properties.date as any;

      const header = headerProperty?.title?.[0]?.text?.content || '';
      const richText = contentProperty?.rich_text || [];
      const date = dateProperty?.date?.start || '';

      // DEBUG: Her row'un link içerip içermediğini kontrol et
      const hasLinks = richText.some((block: any) => block.href || block.text?.link?.url);
      console.log(`Row "${header}" has links:`, hasLinks);

      return {
        header: header,
        content: cleanContent(richText),
        date: date,
      };
    });

  console.log('Processed events count:', rowsStructured.length);
  return rowsStructured;
};