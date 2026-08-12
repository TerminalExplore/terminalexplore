from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


WIDTH = 720
HEIGHT = 405
SCALE = 2
FPS = 25
FRAME_COUNT = 200
BACKGROUND = 8
RAMP = " .:-=+*#%@"


def find_font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont:
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    raise FileNotFoundError(f"None of the requested fonts exist: {candidates}")


FONT_MONO = find_font(
    [
        "C:/Windows/Fonts/CascadiaMono.ttf",
        "C:/Windows/Fonts/consola.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ],
    14 * SCALE,
)
FONT_TITLE = find_font(
    [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    62 * SCALE,
)


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def smoothstep(value: float) -> float:
    value = clamp(value)
    return value * value * (3.0 - 2.0 * value)


def ease_out_cubic(value: float) -> float:
    value = clamp(value)
    return 1.0 - (1.0 - value) ** 3


def lerp(start: float, end: float, amount: float) -> float:
    return start + (end - start) * amount


def text_width(draw: ImageDraw.ImageDraw, text: str) -> float:
    if not text:
        return 0.0
    return draw.textlength(text, font=FONT_TITLE)


def draw_globe(draw: ImageDraw.ImageDraw, frame: int) -> None:
    cols = WIDTH // 7
    rows = HEIGHT // 14
    cell_w = 7
    cell_h = 14
    radius = WIDTH * 0.5
    center_x = 0.0
    center_y = HEIGHT * 0.5

    # One full rotation makes the GIF loop without a jump.
    rotation = (frame / FRAME_COUNT) * math.tau
    cos_r = math.cos(rotation)
    sin_r = math.sin(rotation)
    tilt = 0.42
    cos_t = math.cos(tilt)
    sin_t = math.sin(tilt)
    period = cols * 1.6
    chars = len(RAMP) - 1

    for row in range(rows):
        yp = (row * cell_h - center_y) / radius
        if yp < -1.0 or yp > 1.0:
            continue

        sin_lat = yp
        cos_lat = math.sqrt(max(0.0, 1.0 - sin_lat * sin_lat))
        lat = math.asin(sin_lat)

        for col in range(cols):
            xp = (col * cell_w - center_x) / radius
            if xp * xp + sin_lat * sin_lat > 1.0:
                continue

            cos_lon = 0.0 if cos_lat == 0.0 else xp / cos_lat
            lon = math.acos(max(-1.0, min(1.0, cos_lon)))
            if col * cell_w - center_x < 0.0:
                lon = -lon

            y3 = math.cos(lat) * math.cos(lon)
            z3 = math.cos(lat) * math.sin(lon) * sin_r + math.sin(lat) * cos_r
            z_tilted = y3 * sin_t + z3 * cos_t
            if z_tilted < 0.0:
                continue

            x_tilted = (
                math.cos(lat) * math.sin(lon) * cos_r
                - math.sin(lat) * sin_r
            )
            y_tilted = y3 * cos_t - z3 * sin_t

            u = (lon + math.pi) / math.tau
            v = (lat + math.pi / 2.0) / math.pi
            checker = (
                1.0
                if math.floor(u * period) % 2
                == math.floor(v * period * 0.5) % 2
                else 0.5
            )

            nx = math.cos(lat) * math.sin(lon)
            nz = math.cos(lat) * math.cos(lon)
            light_x, light_y, light_z = 0.45, 0.55, 0.72
            light_len = math.sqrt(
                light_x * light_x + light_y * light_y + light_z * light_z
            )
            diffuse = max(
                0.0,
                (nx * light_x + math.sin(lat) * light_y + nz * light_z)
                / light_len,
            )

            edge = math.sqrt(x_tilted * x_tilted + y_tilted * y_tilted)
            limb = math.pow(z_tilted, 0.55) * (1.0 - edge * 0.18)
            luminance = checker * (diffuse * 0.7 + 0.22) * limb
            char_index = round(luminance * chars)
            char = RAMP[max(0, min(chars, char_index))]
            if char == " ":
                continue

            value = round(178 * luminance)
            # Keep the exact sphere geometry while softly fading its far edge.
            edge_fade = 1.0 - smoothstep((col * cell_w - 285.0) / 85.0)
            value = round(value * edge_fade)
            if value <= BACKGROUND + 2:
                continue

            draw.text(
                (col * cell_w * SCALE, row * cell_h * SCALE),
                char,
                font=FONT_MONO,
                fill=(value, value, value),
            )


def draw_title(
    frame: Image.Image,
    text: str,
    alpha: float,
    caret_x: float | None,
    char_fragment: tuple[str, float, float] | None = None,
) -> None:
    layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    x = 50 * SCALE
    y = 161 * SCALE
    color = (242, 242, 242, round(255 * clamp(alpha)))
    draw.text((x, y), text, font=FONT_TITLE, fill=color, anchor="la")

    if char_fragment:
        char, offset, char_alpha = char_fragment
        draw.text(
            (x + offset, y),
            char,
            font=FONT_TITLE,
            fill=(242, 242, 242, round(255 * clamp(alpha * char_alpha))),
            anchor="la",
        )

    if caret_x is not None:
        caret_alpha = 0.5 + 0.5 * math.sin((caret_x + 1.0) * 0.03)
        caret_alpha = lerp(0.72, 1.0, caret_alpha)
        cx = round((50 + caret_x) * SCALE)
        top = 172 * SCALE
        bottom = 222 * SCALE
        draw.rounded_rectangle(
            (cx, top, cx + 2 * SCALE, bottom),
            radius=SCALE,
            fill=(232, 232, 232, round(255 * alpha * caret_alpha)),
        )

    frame.alpha_composite(layer)


def draw_pointer(
    frame: Image.Image,
    x: float,
    y: float,
    alpha: float,
    pressed: float,
) -> None:
    layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    size = 0.92 - pressed * 0.08
    points = [
        (0, 0),
        (0, 22),
        (6, 16),
        (11, 27),
        (15, 25),
        (10, 15),
        (18, 15),
    ]
    scaled = [
        ((x + px * size) * SCALE, (y + py * size + pressed * 2.0) * SCALE)
        for px, py in points
    ]
    outline = max(2, SCALE)
    draw.polygon(
        scaled,
        fill=(10, 10, 10, round(255 * clamp(alpha))),
        outline=(224, 224, 224, round(255 * clamp(alpha))),
        width=outline,
    )
    frame.alpha_composite(layer)


def draw_up_arrow(frame: Image.Image, progress: float, opacity: float, bounce: float) -> None:
    progress = smoothstep(progress)
    opacity = clamp(opacity)
    if progress <= 0.0 or opacity <= 0.0:
        return

    layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    center_x = 115 * SCALE
    bottom_y = (145 - bounce) * SCALE
    top_y = (105 - bounce) * SCALE
    current_y = lerp(bottom_y, top_y, progress)
    color = (226, 226, 226, round(255 * opacity))
    width = 2 * SCALE

    draw.line((center_x, bottom_y, center_x, current_y), fill=color, width=width)
    head_progress = smoothstep((progress - 0.55) / 0.45)
    if head_progress > 0.0:
        wing = 10 * SCALE * head_progress
        drop = 10 * SCALE * head_progress
        draw.line(
            (center_x, top_y, center_x - wing, top_y + drop),
            fill=color,
            width=width,
        )
        draw.line(
            (center_x, top_y, center_x + wing, top_y + drop),
            fill=color,
            width=width,
        )
    frame.alpha_composite(layer)


def grayscale_palette() -> list[int]:
    palette: list[int] = []
    for index in range(256):
        value = min(255, index * 4) if index < 64 else 252
        palette.extend((value, value, value))
    return palette


def to_palette(frame: Image.Image, palette: list[int]) -> Image.Image:
    gray = frame.convert("RGB").convert("L")
    quantized = gray.point(lambda value: min(63, round(value / 4)))
    paletted = Image.frombytes("P", frame.size, quantized.tobytes())
    paletted.putpalette(palette)
    return paletted


def foreground_state(frame_index: int) -> dict[str, object]:
    seconds = frame_index / FPS
    full_text = "TerminalExplore"
    links_text = "Links"

    state: dict[str, object] = {
        "text": full_text,
        "alpha": smoothstep(seconds / 0.35),
        "caret_x": None,
        "fragment": None,
        "pointer": None,
        "arrow_progress": 0.0,
        "arrow_opacity": 0.0,
        "arrow_bounce": 0.0,
    }

    if seconds < 1.45:
        state["caret_x"] = None
    elif seconds < 2.85:
        erase_progress = clamp((seconds - 1.45) / 1.4)
        exact = erase_progress * len(full_text)
        removed = min(len(full_text), int(exact))
        char_progress = smoothstep(exact - removed)
        visible_count = len(full_text) - removed
        prefix_count = max(0, visible_count - 1)
        prefix = full_text[:prefix_count]
        fading_char = full_text[prefix_count:visible_count]

        scratch = ImageDraw.Draw(Image.new("L", (1, 1)))
        prefix_width = text_width(scratch, prefix) / SCALE
        char_width = text_width(scratch, fading_char) / SCALE
        state["text"] = prefix
        state["caret_x"] = prefix_width + char_width * (1.0 - char_progress)
        if fading_char:
            state["fragment"] = (
                fading_char,
                prefix_width * SCALE,
                1.0 - char_progress,
            )
    elif seconds < 3.08:
        state["text"] = ""
        state["caret_x"] = 0.0
    elif seconds < 3.83:
        type_progress = clamp((seconds - 3.08) / 0.75)
        exact = type_progress * len(links_text)
        completed = min(len(links_text), int(exact))
        char_progress = smoothstep(exact - completed)
        prefix = links_text[:completed]
        next_char = links_text[completed : completed + 1]

        scratch = ImageDraw.Draw(Image.new("L", (1, 1)))
        prefix_width = text_width(scratch, prefix) / SCALE
        next_width = text_width(scratch, next_char) / SCALE
        state["text"] = prefix
        state["caret_x"] = prefix_width + next_width * char_progress
        if next_char:
            state["fragment"] = (
                next_char,
                prefix_width * SCALE,
                char_progress,
            )
    else:
        state["text"] = links_text

    if 4.4 <= seconds < 5.75:
        move = ease_out_cubic((seconds - 4.4) / 0.82)
        start_x, start_y = 755.0, 345.0
        target_x, target_y = 194.0, 198.0
        x = lerp(start_x, target_x, move)
        y = lerp(start_y, target_y, move)
        pressed = smoothstep(1.0 - abs(seconds - 5.34) / 0.12)
        fade_out = 1.0 - smoothstep((seconds - 5.52) / 0.23)
        state["pointer"] = (x, y, fade_out, pressed)

    if seconds >= 5.4:
        state["arrow_progress"] = clamp((seconds - 5.4) / 0.46)
        state["arrow_opacity"] = smoothstep((seconds - 5.4) / 0.16)
        if seconds > 5.9:
            state["arrow_bounce"] = max(
                0.0,
                math.sin((seconds - 5.9) * math.tau / 1.15) * 2.0,
            )

    if seconds >= 7.35:
        fade = 1.0 - smoothstep((seconds - 7.35) / 0.65)
        state["alpha"] = float(state["alpha"]) * fade
        state["arrow_opacity"] = float(state["arrow_opacity"]) * fade
        pointer = state["pointer"]
        if pointer:
            px, py, pointer_alpha, pressed = pointer
            state["pointer"] = (px, py, pointer_alpha * fade, pressed)

    return state


def render_frame(frame_index: int) -> Image.Image:
    frame = Image.new(
        "RGBA",
        (WIDTH * SCALE, HEIGHT * SCALE),
        (BACKGROUND, BACKGROUND, BACKGROUND, 255),
    )
    draw_globe(ImageDraw.Draw(frame), frame_index)
    state = foreground_state(frame_index)

    draw_title(
        frame,
        str(state["text"]),
        float(state["alpha"]),
        state["caret_x"] if isinstance(state["caret_x"], float) else None,
        state["fragment"] if isinstance(state["fragment"], tuple) else None,
    )
    draw_up_arrow(
        frame,
        float(state["arrow_progress"]),
        float(state["arrow_opacity"]),
        float(state["arrow_bounce"]),
    )
    pointer = state["pointer"]
    if isinstance(pointer, tuple):
        draw_pointer(frame, *pointer)

    return frame.convert("RGB").resize(
        (WIDTH, HEIGHT),
        resample=Image.Resampling.LANCZOS,
    )


def generate(output: Path) -> None:
    palette = grayscale_palette()
    frames: list[Image.Image] = []
    for frame_index in range(FRAME_COUNT):
        frames.append(to_palette(render_frame(frame_index), palette))

    output.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        output,
        save_all=True,
        append_images=frames[1:],
        duration=round(1000 / FPS),
        loop=0,
        disposal=2,
        optimize=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate the Telegram links GIF")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("public/telegram-links.gif"),
    )
    args = parser.parse_args()
    generate(args.output)
    print(args.output.resolve())


if __name__ == "__main__":
    main()
