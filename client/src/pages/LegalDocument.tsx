import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Loader2, Home, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

// Check if content is HTML (starts with HTML tags)
function isHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  const lower = trimmed.toLowerCase();
  return lower.startsWith('<!doctype') || 
         lower.startsWith('<html') || 
         lower.startsWith('<div') ||
         lower.startsWith('<p>') ||
         lower.startsWith('<h1') ||
         lower.startsWith('<section') ||
         lower.startsWith('<body') ||
         (trimmed.includes('<') && trimmed.includes('</') && (lower.includes('<p>') || lower.includes('<div') || lower.includes('<h1') || lower.includes('<ul') || lower.includes('<ol')));
}

// Extract body content from full HTML document
function extractBodyContent(html: string): string {
  // If it's a full HTML document, extract just the body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1].trim();
  }
  // If no body tag, return as-is
  return html;
}

export default function LegalDocument() {
  const { user } = useAuth();
  const params = useParams();
  const slug = params.slug as string;

  const { data: document, isLoading, error } = trpc.platformDocuments.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
                <span className="font-bold text-xl">{APP_TITLE}</span>
              </a>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/">
                <a className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </a>
              </Link>
              {!user && (
                <a
                  href={getLoginUrl()}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Sign In
                </a>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h1 className="text-2xl font-bold mb-2">Document Not Found</h1>
              <p className="text-muted-foreground mb-6">
                {error.message || "The document you're looking for doesn't exist or has been removed."}
              </p>
              <Link href="/">
                <a className="text-primary hover:underline">Return to Homepage</a>
              </Link>
            </div>
          ) : document ? (
            <article className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">{document.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(document.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {document.version > 1 && ` • Version ${document.version}`}
                </p>
              </div>
              {isHtmlContent(document.content) ? (
                <div 
                  className="legal-content"
                  dangerouslySetInnerHTML={{ __html: extractBodyContent(document.content) }} 
                />
              ) : (
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{document.content}</ReactMarkdown>
              )}
            </article>
          ) : null}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
