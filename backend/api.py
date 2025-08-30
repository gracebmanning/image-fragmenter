import io
from flask import Flask, request, send_file, jsonify
from PIL import Image
import imageio.v3 as iio
import random
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS to allow React app to make requests
CORS(app)


def create_animation(image_file_storage, num_loops, duration_s):
    """
    Processes an uploaded image to create a GIF animation in memory.
    """
    try:
        # Load the original image from the request's in-memory file storage
        original = Image.open(image_file_storage.stream).convert("RGBA")
        img = original.copy()
        width, height = img.size

        # Store each generated frame in a list in memory
        frames = []

        # Add the initial frame
        # Convert PIL image to numpy array for imageio
        frames.append(np.array(img))

        # Generate subsequent frames
        for _ in range(num_loops):
            # Define a random crop area
            left = random.randint(0, width)
            top = random.randint(0, height)
            # Ensure crop dimensions are valid and at least 1x1 pixel
            right = left + random.randint(1, max(1, width - left))
            bottom = top + random.randint(1, max(1, height - top))

            crop = original.crop((left, top, right, bottom))

            # Define a random paste position
            paste_x = random.randint(0, max(0, width - crop.width))
            paste_y = random.randint(0, max(0, height - crop.height))

            # Paste the crop. The RGBA conversion handles transparency correctly.
            img.paste(crop, (paste_x, paste_y),
                      crop if crop.mode == 'RGBA' else None)

            # Add the new frame to our list
            frames.append(np.array(img))

        # Create the GIF in memory
        output_gif = io.BytesIO()
        frame_duration_ms = (duration_s * 1000) / len(frames)

        # Use imageio to write the GIF from the numpy array frames
        iio.imwrite(output_gif, frames, format='GIF-PIL',
                    duration=frame_duration_ms, loop=0)

        # Move the "cursor" to the beginning of the byte stream
        output_gif.seek(0)

        return output_gif

    except Exception as e:
        print(f"Error during image processing: {e}")
        return None


@app.route('/api/generate', methods=['POST'])
def generate():
    # --- Input Validation ---
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({"error": "No image file selected"}), 400

    try:
        num_loops = int(request.form.get('loops', 40))
        duration = int(request.form.get('duration', 5))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'loops' or 'duration' parameter"}), 400

    # --- Animation Creation ---
    generated_gif_bytes = create_animation(image_file, num_loops, duration)

    if generated_gif_bytes is None:
        return jsonify({"error": "Failed to process image. It might be corrupted or in an unsupported format."}), 500

    # --- Send the file back to the client ---
    return send_file(
        generated_gif_bytes,
        mimetype='image/gif',
        as_attachment=True,
        download_name='animation.gif'
    )


if __name__ == '__main__':
    # Use 0.0.0.0 to make it accessible on your local network
    app.run(host='0.0.0.0', port=5001, debug=True)
