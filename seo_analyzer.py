
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import tldextract
import asyncio
from playwright.async_api import async_playwright
import re

class SEOAnalyzer:
    def __init__(self, base_url, max_depth=2):
        self.base_url = base_url
        self.max_depth = max_depth
        self.visited = set()
        self.domain = tldextract.extract(base_url).registered_domain

    async def fetch_page(self, page, browser):
        try:
            context = await browser.new_context()
            page_obj = await context.new_page()
            await page_obj.goto(page, timeout=60000)
            content = await page_obj.content()
            await context.close()
            return content
        except Exception as e:
            print(f"Error fetching {page}: {e}")
            return None

    def get_internal_links(self, soup, current_url):
        links = set()
        for a_tag in soup.find_all('a', href=True):
            href = urljoin(current_url, a_tag['href'])
            parsed = urlparse(href)
            clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
            if self.domain in clean_url and clean_url not in self.visited:
                links.add(clean_url)
        return links

    def analyze_html(self, url, html):
        soup = BeautifulSoup(html, 'html.parser')
        analysis = {
            'url': url,
            'title': soup.title.string.strip() if soup.title else "",
            'meta_description': '',
            'meta_keywords': '',
            'h_tags': [],
            'alt_tags': [],
            'word_count': 0
        }

        for meta in soup.find_all('meta'):
            name = meta.get('name', '').lower()
            if name == 'description':
                analysis['meta_description'] = meta.get('content', '')
            elif name == 'keywords':
                analysis['meta_keywords'] = meta.get('content', '')

        for h_tag in soup.find_all(re.compile('^h[1-3]$')):
            analysis['h_tags'].append((h_tag.name, h_tag.get_text(strip=True)))

        for img in soup.find_all('img'):
            alt = img.get('alt', '')
            if alt:
                analysis['alt_tags'].append(alt)

        text = soup.get_text()
        analysis['word_count'] = len(text.split())

        return analysis

    async def crawl(self):
        results = []
        queue = [(self.base_url, 0)]

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)

            while queue:
                current_url, depth = queue.pop(0)
                if current_url in self.visited or depth > self.max_depth:
                    continue
                self.visited.add(current_url)

                html = await self.fetch_page(current_url, browser)
                if html is None:
                    continue

                analysis = self.analyze_html(current_url, html)
                results.append(analysis)

                soup = BeautifulSoup(html, 'html.parser')
                links = self.get_internal_links(soup, current_url)
                for link in links:
                    queue.append((link, depth + 1))

            await browser.close()

        return results
