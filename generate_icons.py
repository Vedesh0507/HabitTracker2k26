"""
Generate PWA Icons for Habit Tracker 2026
Creates PNG icons with purple gradient, checkmark, and progress circle
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    """Generate a single icon at the specified size"""
    
    # Create transparent image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Rounded corner radius (20% of size)
    corner_radius = int(size * 0.2)
    
    # Purple gradient colors
    color1 = (139, 92, 246)  # #8b5cf6 - top
    color2 = (109, 40, 217)  # #6d28d9 - bottom
    
    # Draw vertical gradient background
    for y in range(size):
        ratio = y / size
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # Create mask for rounded corners
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, size-1, size-1], radius=corner_radius, fill=255)
    
    # Apply rounded corner mask
    img.putalpha(mask)
    
    # Get fresh draw object after alpha change
    draw = ImageDraw.Draw(img)
    
    # Calculate circle parameters
    center = size // 2
    circle_radius = int(size * 0.27)
    circle_width = max(3, int(size * 0.047))
    
    # Draw progress circle
    bbox = [
        center - circle_radius, 
        center - circle_radius, 
        center + circle_radius, 
        center + circle_radius
    ]
    
    # Full faded circle (background)
    draw.arc(bbox, 0, 360, fill=(255, 255, 255, 100), width=circle_width)
    # Partial bright arc (progress indicator - 75%)
    draw.arc(bbox, -90, 180, fill=(255, 255, 255, 255), width=circle_width)
    
    # Draw checkmark
    check_width = max(4, int(size * 0.065))
    
    # Checkmark control points
    p1 = (int(size * 0.35), int(size * 0.50))  # Start
    p2 = (int(size * 0.45), int(size * 0.60))  # Middle (bottom of check)
    p3 = (int(size * 0.67), int(size * 0.38))  # End
    
    # Draw checkmark lines
    draw.line([p1, p2], fill=(255, 255, 255, 255), width=check_width)
    draw.line([p2, p3], fill=(255, 255, 255, 255), width=check_width)
    
    # Add "2026" text for larger icons
    if size >= 144:
        try:
            font_size = int(size * 0.095)
            # Try Windows font path
            font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', font_size)
            
            text = '2026'
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_x = (size - text_width) // 2
            text_y = int(size * 0.80)
            
            draw.text((text_x, text_y), text, fill=(255, 255, 255, 230), font=font)
        except Exception as e:
            print(f"  Could not add text to {size}x{size}: {e}")
    
    return img


def main():
    """Generate all required icon sizes"""
    
    # Ensure icons directory exists
    os.makedirs('icons', exist_ok=True)
    
    # Required PWA icon sizes
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    print("Generating Habit Tracker 2026 PWA Icons...")
    print("-" * 40)
    
    for size in sizes:
        icon = create_icon(size)
        filename = f'icons/icon-{size}x{size}.png'
        icon.save(filename, 'PNG')
        
        # Get file size
        file_size = os.path.getsize(filename)
        print(f"  ✓ {filename} ({file_size:,} bytes)")
    
    print("-" * 40)
    print("All icons generated successfully!")
    print("\nIcons include:")
    print("  • Purple gradient background")
    print("  • Progress circle indicator")
    print("  • Checkmark symbol")
    print("  • '2026' text (144px+)")


if __name__ == '__main__':
    main()
