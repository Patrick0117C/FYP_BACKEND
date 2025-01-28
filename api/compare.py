import sys
import torch
from torchvision import models, transforms
from PIL import Image
from scipy.spatial.distance import cosine

def extract_features(image):
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    
    image_tensor = preprocess(image).unsqueeze(0)
    model = models.resnet18(weights='IMAGENET1K_V1')
    model.eval()
    
    with torch.no_grad():
        features = model(image_tensor)

    return features.squeeze()

def calculate_similarity(signature1, signature2):
    features1 = extract_features(signature1)
    features2 = extract_features(signature2)
    similarity = 1 - cosine(features1.numpy(), features2.numpy())
    return similarity

def add_white_background(image):
    # Convert to RGBA to handle transparency
    image = image.convert("RGBA")
    
    # Create a new image with a white background
    white_background = Image.new("RGBA", image.size, (255, 255, 255, 255))
    
    # Paste the original image onto the white background
    white_background.paste(image, (0, 0), image)  # The third argument is the mask
    
    # Convert to RGB (removes alpha channel)
    return white_background.convert("RGB")

if __name__ == "__main__":
    # Get the file paths from command-line arguments
    signature1_path = sys.argv[1]
    signature2_path = sys.argv[2]
    
    # Open the images
    signature1 = Image.open(signature1_path)
    signature2 = Image.open(signature2_path)

    # Add white background
    signature1 = add_white_background(signature1)
    signature2 = add_white_background(signature2)
    
    # Calculate similarity
    similarity_score = calculate_similarity(signature1, signature2)
    print(float(similarity_score))
