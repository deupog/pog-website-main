import { Client } from "@notionhq/client";

const notionSecret = process.env.NOTION_SECRET;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

const notion = new Client({ auth: notionSecret });

// Row tipini güncelle - link bilgisini de içerecek şekilde
type Row = {
  header: { 
    id: string; 
    title: { 
      text: { 
        content: string 
      } 
    }[] 
  };
  content: { 
    id: string; 
    rich_text: { 
      type: string;
      text: { 
        content: string;
        link?: { url: string }  // LINK BİLGİSİ EKLENDİ
      };
      href?: string;  // HREF BİLGİSİ EKLENDİ
      plain_text: string;
      annotations?: any;
    }[] 
  };
  date: { 
    id: string; 
    date: { 
      start: string 
    } 
  };
};

export type EventData = {
  header: string;
  content: string;
  date: string;
};

// Content temizleme fonksiyonunu GÜNCELLE - linkleri koru
const cleanContent = (richText: any[]): string => {
  if (!richText || richText.length === 0) return '';

  // Rich text'i işle - linkleri koru
  const processedContent = richText.map(block => {
    const text = block.plain_text || block.text?.content || '';
    
    // LINK KONTROLÜ - hem href hem de text.link
    const linkUrl = block.href || block.text?.link?.url;
    
    // Eğer link varsa HTML linkine çevir
    if (linkUrl) {
      return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${text}</a>`;
    }
    
    // Link yoksa normal metin
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

  // DEBUG: Notion API yanıtını kontrol et
  console.log('=== NOTION API RAW RESPONSE ===');
  if (query.results.length > 0) {
    const firstResult = query.results[0];
    console.log('First result properties:', firstResult.properties);
    console.log('Content rich_text:', firstResult.properties?.content?.rich_text);
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const rows = query.results.map((res) => res.properties) as Row[];

  const rowsStructured: EventData[] = rows.map((row) => {
    const richText = row.content?.rich_text || [];
    
    // DEBUG: Her row'un link içerip içermediğini kontrol et
    const hasLinks = richText.some(block => block.href || block.text?.link?.url);
    console.log('Row has links:', hasLinks, 'Content:', richText);

    return {
      header: row.header?.title[0]?.text?.content || '',
      content: cleanContent(richText),  // GÜNCELLENDİ - artık linkleri koruyor
      date: row.date?.date?.start || '',
    };
  });

  return rowsStructured;
};