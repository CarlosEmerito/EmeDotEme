#!/usr/bin/env python3
"""
Generate Open Graph image for EmeDotEme
Image size: 1200x630 pixels
"""

from PIL import Image, ImageDraw, ImageFont
import os

def generate_og_image():
    # Create image
    width, height = 1200, 630
    image = Image.new('RGB', (width, height), color=(124, 58, 237))  # Brand color #7c3aed
    
    draw = ImageDraw.Draw(image)
    
    # Try to load fonts (use default if not available)
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
    except:
        # Fallback to default font
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    # Draw logo/text
    title = "EmeDotEme"
    subtitle = "Noticias Cripto • Bitcoin • Web3"
    
    # Calculate text positions
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    title_height = title_bbox[3] - title_bbox[1]
    
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_height = subtitle_bbox[3] - subtitle_bbox[1]
    
    # Center text
    title_x = (width - title_width) // 2
    title_y = (height - title_height) // 2 - 40
    
    subtitle_x = (width - subtitle_width) // 2
    subtitle_y = title_y + title_height + 20
    
    # Draw white text with shadow
    shadow_offset = 4
    draw.text((title_x + shadow_offset, title_y + shadow_offset), title, font=title_font, fill=(0, 0, 0, 128))
    draw.text((title_x, title_y), title, font=title_font, fill=(255, 255, 255))
    
    draw.text((subtitle_x + shadow_offset, subtitle_y + shadow_offset), subtitle, font=subtitle_font, fill=(0, 0, 0, 128))
    draw.text((subtitle_x, subtitle_y), subtitle, font=subtitle_font, fill=(255, 255, 255))
    
    # Add accent line
    draw.rectangle([width//2 - 150, subtitle_y + subtitle_height + 30, width//2 + 150, subtitle_y + subtitle_height + 40], fill=(234, 179, 8))
    
    # Save image
    output_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'og.jpg')
    image.save(output_path, 'JPEG', quality=90)
    print(f"✅ Open Graph image generated: {output_path}")

if __name__ == "__main__":
    generate_og_image()