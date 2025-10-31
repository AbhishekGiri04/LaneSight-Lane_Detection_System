from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import cv2
import numpy as np
from collections import deque
import warnings
warnings.filterwarnings('ignore')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
os.makedirs("output", exist_ok=True)

class AdvancedLaneDetector:
    def __init__(self):
        self.left_fit_history = deque(maxlen=15)
        self.right_fit_history = deque(maxlen=15)

        self.offset_history = deque(maxlen=8)
        self.lane_departure_threshold = 0.3
        self.warning_active = False
        self.frame_count = 0
        self.lost_lane_count = 0
        self.curvature_history = deque(maxlen=5)
        
    def adaptive_roi(self, img, perspective='car_pov'):
        """Optimized ROI for better lane detection"""
        height, width = img.shape[:2]
        
        # Improved ROI for car dashboard perspective
        vertices = np.array([
            [(width * 0.05, height),
             (width * 0.4, height * 0.6),
             (width * 0.6, height * 0.6),
             (width * 0.95, height)]
        ], dtype=np.int32)
        
        mask = np.zeros_like(img)
        cv2.fillPoly(mask, vertices, 255)
        return cv2.bitwise_and(img, mask)
    
    def sliding_window(self, binary):
        """Advanced sliding window with history-based margin and RANSAC fitting"""
        h, w = binary.shape
        histogram = np.sum(binary[h//2:,:], axis=0)
        
        # Smooth histogram to reduce noise
        histogram = cv2.GaussianBlur(histogram.astype(np.float32), (21,1), 0)
        
        midpoint = w//2
        leftx_base = np.argmax(histogram[:midpoint])
        rightx_base = np.argmax(histogram[midpoint:]) + midpoint
        
        # More windows for better precision in curves
        nwindows = 12
        window_height = h // nwindows
        nonzero = binary.nonzero()
        nonzeroy = np.array(nonzero[0])
        nonzerox = np.array(nonzero[1])
        
        leftx_current = leftx_base
        rightx_current = rightx_base
        
        # History-based adaptive margin
        base_margin = 50 if len(self.left_fit_history) > 0 else 80
        minpix = 40
        
        left_lane_inds = []
        right_lane_inds = []
        
        for window in range(nwindows):
            win_y_low = h - (window + 1) * window_height
            win_y_high = h - window * window_height
            
            # Adaptive margin - wider at top for curves
            margin = base_margin + (window * 3)
            
            win_xleft_low = leftx_current - margin
            win_xleft_high = leftx_current + margin
            win_xright_low = rightx_current - margin
            win_xright_high = rightx_current + margin
            
            good_left = ((nonzeroy >= win_y_low) & (nonzeroy < win_y_high) &
                         (nonzerox >= win_xleft_low) & (nonzerox < win_xleft_high)).nonzero()[0]
            good_right = ((nonzeroy >= win_y_low) & (nonzeroy < win_y_high) &
                          (nonzerox >= win_xright_low) & (nonzerox < win_xright_high)).nonzero()[0]
            
            left_lane_inds.append(good_left)
            right_lane_inds.append(good_right)
            
            if len(good_left) > minpix:
                leftx_current = int(np.mean(nonzerox[good_left]))
            if len(good_right) > minpix:
                rightx_current = int(np.mean(nonzerox[good_right]))
        
        try:
            left_lane_inds = np.concatenate(left_lane_inds)
            right_lane_inds = np.concatenate(right_lane_inds)
        except:
            return None, None
        
        leftx = nonzerox[left_lane_inds]
        lefty = nonzeroy[left_lane_inds]
        rightx = nonzerox[right_lane_inds]
        righty = nonzeroy[right_lane_inds]
        
        # RANSAC polynomial fitting to reject outliers
        left_fit = self.ransac_polyfit(lefty, leftx) if len(leftx) > 80 else None
        right_fit = self.ransac_polyfit(righty, rightx) if len(rightx) > 80 else None
        
        return left_fit, right_fit
    
    def ransac_polyfit(self, y, x, max_trials=100, residual_threshold=50):
        """RANSAC polynomial fitting to reject outliers"""
        if len(y) < 10:
            return None
            
        best_fit = None
        best_inliers = 0
        
        for _ in range(max_trials):
            # Random sample
            sample_indices = np.random.choice(len(y), min(10, len(y)//2), replace=False)
            sample_y = y[sample_indices]
            sample_x = x[sample_indices]
            
            try:
                # Fit polynomial
                fit = np.polyfit(sample_y, sample_x, 2)
                
                # Calculate residuals for all points
                predicted_x = np.polyval(fit, y)
                residuals = np.abs(x - predicted_x)
                
                # Count inliers
                inliers = np.sum(residuals < residual_threshold)
                
                if inliers > best_inliers:
                    best_inliers = inliers
                    best_fit = fit
                    
            except:
                continue
        
        # Fallback to regular polyfit if RANSAC fails
        if best_fit is None:
            try:
                best_fit = np.polyfit(y, x, 2)
            except:
                return None
                
        return best_fit
    

    

    
    def calculate_curvature_and_offset(self, left_fit, right_fit, frame_width, frame_height):
        """Calculate real-world curvature and vehicle offset with smoothing"""
        if left_fit is None or right_fit is None:
            return 0, False, 0
        
        # Real-world conversions
        ym_per_pix = 30/720  # meters per pixel in y dimension
        xm_per_pix = 3.7/700 # meters per pixel in x dimension
        
        # Evaluation point at bottom of frame
        y_eval = frame_height
        
        # Calculate curvature radius in real world
        left_curverad = ((1 + (2*left_fit[0]*y_eval*ym_per_pix + left_fit[1])**2)**1.5) / np.abs(2*left_fit[0]) if left_fit[0] != 0 else 10000
        right_curverad = ((1 + (2*right_fit[0]*y_eval*ym_per_pix + right_fit[1])**2)**1.5) / np.abs(2*right_fit[0]) if right_fit[0] != 0 else 10000
        
        # Average curvature
        curvature = (left_curverad + right_curverad) / 2
        self.curvature_history.append(curvature)
        smooth_curvature = np.mean(self.curvature_history)
        
        # Calculate vehicle offset
        left_fitx = left_fit[0]*y_eval**2 + left_fit[1]*y_eval + left_fit[2]
        right_fitx = right_fit[0]*y_eval**2 + right_fit[1]*y_eval + right_fit[2]
        
        lane_center = (left_fitx + right_fitx) / 2
        vehicle_center = frame_width / 2
        offset = (vehicle_center - lane_center) * xm_per_pix
        
        # Smooth offset using history
        self.offset_history.append(offset)
        smooth_offset = np.mean(self.offset_history)
        
        # Adaptive threshold based on curvature
        if smooth_curvature > 1000:  # Straight road
            threshold = 0.3
        elif smooth_curvature > 500:  # Slight curve
            threshold = 0.4
        else:  # Sharp curve
            threshold = 0.6
        
        lane_departure = abs(smooth_offset) > threshold
        
        return smooth_offset, lane_departure, smooth_curvature
    
    def average_fit(self, fit, history):
        """Smooth polynomial using history"""
        if fit is not None:
            history.append(fit)
        if len(history) == 0:
            return None
        weights = np.linspace(0.2, 1.0, len(history))
        weights /= weights.sum()
        return np.average(np.array(history), axis=0, weights=weights)
    
    def draw_lane_with_dashes(self, frame, left_fit, right_fit, offset, lane_departure, curvature=0):
        """Advanced drawing with adaptive dashes and curvature display"""
        height, width = frame.shape[:2]
        
        # Detect if frame is dark for adaptive visualization
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        is_dark = np.mean(gray) < 100
        
        if left_fit is not None and right_fit is not None:
            # Dense points for smooth tracking
            ploty = np.linspace(int(height * 0.5), height-5, 120)
            left_fitx = left_fit[0]*ploty**2 + left_fit[1]*ploty + left_fit[2]
            right_fitx = right_fit[0]*ploty**2 + right_fit[1]*ploty + right_fit[2]
            
            left_fitx = np.clip(left_fitx, 0, width-1)
            right_fitx = np.clip(right_fitx, 0, width-1)
            
            # Draw lane area with enhanced visibility for night
            overlay = np.zeros_like(frame)
            pts_left = np.array([np.transpose(np.vstack([left_fitx, ploty]))])
            pts_right = np.array([np.flipud(np.transpose(np.vstack([right_fitx, ploty])))])
            pts = np.hstack((pts_left, pts_right))
            
            if lane_departure:
                color = (0, 0, 200) if not is_dark else (0, 0, 255)
            else:
                color = (0, 180, 0) if not is_dark else (0, 255, 0)
            
            cv2.fillPoly(overlay, pts.astype(np.int32), color)
            alpha = 0.15 if not is_dark else 0.25
            frame = cv2.addWeighted(frame, 1-alpha, overlay, alpha, 0)
            
            # Adaptive dash length based on curvature
            if curvature > 1000:  # Straight road
                dash_length = 4
                gap_length = 2
            elif curvature > 500:  # Slight curve
                dash_length = 3
                gap_length = 2
            else:  # Sharp curve
                dash_length = 2
                gap_length = 1
            
            # Enhanced line thickness for night videos
            line_thickness = 5 if is_dark else 4
            line_color = (0, 255, 255) if not is_dark else (0, 255, 255)
            
            for i in range(0, len(ploty)-dash_length, dash_length+gap_length):
                if i+dash_length < len(ploty):
                    y1 = int(ploty[i])
                    y2 = int(ploty[i+dash_length])
                    
                    # Left lane dashes
                    x1, x2 = int(left_fitx[i]), int(left_fitx[i+dash_length])
                    cv2.line(frame, (x1, y1), (x2, y2), line_color, line_thickness)
                    
                    # Right lane dashes
                    x1, x2 = int(right_fitx[i]), int(right_fitx[i+dash_length])
                    cv2.line(frame, (x1, y1), (x2, y2), line_color, line_thickness)
            
            # Enhanced warnings for lane departure - left top corner
            if lane_departure:
                # Flashing effect for critical warnings
                warning_color = (0, 0, 255) if self.frame_count % 20 < 10 else (0, 100, 255)
                cv2.putText(frame, 'LANE DEPARTURE!', (20, 40), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, warning_color, 3)
                cv2.putText(frame, 'RETURN TO LANE', (20, 75), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, warning_color, 2)
        
        elif left_fit is not None:
            ploty = np.linspace(int(height * 0.5), height-5, 80)
            left_fitx = np.clip(left_fit[0]*ploty**2 + left_fit[1]*ploty + left_fit[2], 0, width-1)
            
            line_thickness = 5 if is_dark else 4
            for i in range(0, len(ploty)-3, 6):
                if i+3 < len(ploty):
                    y1, y2 = int(ploty[i]), int(ploty[i+3])
                    x1, x2 = int(left_fitx[i]), int(left_fitx[i+3])
                    cv2.line(frame, (x1, y1), (x2, y2), (0, 255, 255), line_thickness)
        
        elif right_fit is not None:
            ploty = np.linspace(int(height * 0.5), height-5, 80)
            right_fitx = np.clip(right_fit[0]*ploty**2 + right_fit[1]*ploty + right_fit[2], 0, width-1)
            
            line_thickness = 5 if is_dark else 4
            for i in range(0, len(ploty)-3, 6):
                if i+3 < len(ploty):
                    y1, y2 = int(ploty[i]), int(ploty[i+3])
                    x1, x2 = int(right_fitx[i]), int(right_fitx[i+3])
                    cv2.line(frame, (x1, y1), (x2, y2), (0, 255, 255), line_thickness)
        
        self._draw_professional_ui(frame, offset, lane_departure, curvature)
        return frame
    
    def _draw_professional_ui(self, frame, offset, lane_departure, curvature=0):
        """Enhanced UI with curvature display and improved metrics"""
        height, width = frame.shape[:2]
        
        # Calculate accurate confidence
        left_conf = min(len(self.left_fit_history), 10) / 10.0
        right_conf = min(len(self.right_fit_history), 10) / 10.0
        total_conf = (left_conf + right_conf) / 2.0
        
        # Expanded info box for curvature
        box_width = 200
        box_height = 70
        box_x = width - box_width - 10
        box_y = 10
        
        # Colors
        bg_color = (25, 25, 35)
        status_color = (220, 50, 50) if lane_departure else (50, 200, 50)
        text_color = (240, 240, 240)
        
        # Draw main info box
        cv2.rectangle(frame, (box_x, box_y), (box_x + box_width, box_y + box_height), bg_color, -1)
        cv2.rectangle(frame, (box_x, box_y), (box_x + box_width, box_y + box_height), status_color, 2)
        
        # Status
        status = 'DEPARTURE' if lane_departure else 'TRACKING'
        cv2.putText(frame, status, (box_x + 8, box_y + 18), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, status_color, 1)
        
        # Confidence
        cv2.putText(frame, f'Confidence: {total_conf:.0%}', (box_x + 8, box_y + 35), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.35, text_color, 1)
        
        # Curvature radius
        if curvature > 0:
            if curvature > 10000:
                curv_text = 'Straight'
            else:
                curv_text = f'{curvature:.0f}m'
            cv2.putText(frame, f'Curve: {curv_text}', (box_x + 8, box_y + 52), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.35, text_color, 1)
        
        # Offset display (bottom left)
        offset_color = (0, 0, 255) if abs(offset) > 0.3 else (0, 255, 0)
        cv2.putText(frame, f'Offset: {offset:+.2f}m', (20, height - 40), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, offset_color, 2)
        
        # Status indicator
        cv2.circle(frame, (20, height - 20), 8, status_color, -1)
        cv2.circle(frame, (20, height - 20), 8, (255, 255, 255), 1)
    
    def preprocess(self, frame):
        """Advanced preprocessing with LAB, adaptive thresholds, and improved gradients"""
        # Multiple color spaces for maximum robustness
        hls = cv2.cvtColor(frame, cv2.COLOR_BGR2HLS)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        
        # Adaptive brightness detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        is_dark = brightness < 100
        
        # Enhanced contrast with adaptive CLAHE
        l = hls[:,:,1]
        clahe_limit = 3.0 if is_dark else 2.0
        clahe = cv2.createCLAHE(clipLimit=clahe_limit, tileGridSize=(8,8))
        l_enhanced = clahe.apply(l)
        
        # Gaussian blur before Sobel to reduce noise
        l_blurred = cv2.GaussianBlur(l_enhanced, (5, 5), 0)
        
        # Advanced gradient detection with magnitude and direction
        sobelx = cv2.Sobel(l_blurred, cv2.CV_64F, 1, 0, ksize=5)
        sobely = cv2.Sobel(l_blurred, cv2.CV_64F, 0, 1, ksize=5)
        grad_mag = np.sqrt(sobelx**2 + sobely**2)
        grad_dir = np.arctan2(np.abs(sobely), np.abs(sobelx))
        
        # Normalize gradients
        if np.max(grad_mag) > 0:
            scaled_mag = np.uint8(255 * grad_mag / np.max(grad_mag))
        else:
            scaled_mag = np.zeros_like(grad_mag, dtype=np.uint8)
            
        if np.max(sobelx) > 0:
            scaled_sobelx = np.uint8(255 * np.abs(sobelx) / np.max(np.abs(sobelx)))
        else:
            scaled_sobelx = np.zeros_like(sobelx, dtype=np.uint8)
        
        # Adaptive thresholds based on brightness
        if is_dark:
            grad_thresh = (15, 200)
            s_thresh = (80, 255)
            l_thresh = (150, 255)
        else:
            grad_thresh = (25, 255)
            s_thresh = (100, 255)
            l_thresh = (200, 255)
        
        # Gradient binaries with magnitude and direction
        mag_binary = np.zeros_like(scaled_mag)
        mag_binary[(scaled_mag >= grad_thresh[0]) & (scaled_mag <= grad_thresh[1])] = 1
        
        dir_binary = np.zeros_like(grad_dir)
        dir_binary[(grad_dir >= 0.7) & (grad_dir <= 1.3)] = 1
        
        gradx_binary = np.zeros_like(scaled_sobelx)
        gradx_binary[(scaled_sobelx >= grad_thresh[0]) & (scaled_sobelx <= grad_thresh[1])] = 1
        
        # Color detection in multiple spaces
        s = hls[:,:,2]
        s_binary = np.zeros_like(s)
        s_binary[(s >= s_thresh[0]) & (s <= s_thresh[1])] = 1
        
        # Enhanced yellow detection in HSV
        yellow_lower = np.array([18, 80 if is_dark else 100, 80 if is_dark else 100])
        yellow_upper = np.array([35, 255, 255])
        yellow_mask = cv2.inRange(hsv, yellow_lower, yellow_upper)
        
        # White detection in HLS and LAB
        white_hls = np.zeros_like(l)
        white_hls[(l >= l_thresh[0]) & (s <= 40)] = 1
        
        # LAB color space for shadows and lighting variations
        l_lab = lab[:,:,0]
        white_lab = np.zeros_like(l_lab)
        white_lab[l_lab >= (160 if is_dark else 180)] = 1
        
        # Combine all detection methods
        gradient_combined = np.zeros_like(mag_binary)
        gradient_combined[(gradx_binary == 1) | ((mag_binary == 1) & (dir_binary == 1))] = 1
        
        color_combined = np.zeros_like(s_binary)
        color_combined[(s_binary == 1) | (yellow_mask > 0) | (white_hls == 1) | (white_lab == 1)] = 1
        
        # Final combination with priority on color detection
        combined = np.zeros_like(gradient_combined)
        combined[(color_combined == 1) | (gradient_combined == 1)] = 255
        
        return combined
    
    def process_frame(self, frame):
        """Advanced frame processing with all improvements"""
        self.frame_count += 1
        height, width = frame.shape[:2]
        
        # Advanced preprocessing with LAB, adaptive thresholds
        binary = self.preprocess(frame)
        
        # Apply optimized ROI
        roi_binary = self.adaptive_roi(binary)
        
        # Advanced sliding window with RANSAC
        left_fit, right_fit = self.sliding_window(roi_binary)
        
        # Smooth using weighted history
        left_fit = self.average_fit(left_fit, self.left_fit_history)
        right_fit = self.average_fit(right_fit, self.right_fit_history)
        
        # Calculate curvature and offset with smoothing
        offset, lane_departure, curvature = self.calculate_curvature_and_offset(
            left_fit, right_fit, width, height)
        
        # Advanced drawing with adaptive dashes and curvature display
        result_frame = self.draw_lane_with_dashes(frame, left_fit, right_fit, 
                                                 offset, lane_departure, curvature)
        
        return result_frame

# Global detector instance
detector = AdvancedLaneDetector()

@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}

@app.get("/start-detection")
def start_detection(filename: str):
    try:
        input_path = f"uploads/{filename}"
        output_path = "output/processed.mp4"
        
        if not os.path.exists(input_path):
            return {"status": "error", "message": "Video file not found"}
        
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            return {"status": "error", "message": "Cannot open video file"}
            
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # Optimized processing settings
        if width > 720:
            width = 720
            height = int(height * (720 / int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))))
        fps = min(fps, 20)  # Increased FPS for better quality
        
        # Use best codec for quality
        fourcc = cv2.VideoWriter_fourcc(*'H264')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        if not out.isOpened():
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
        if not out.isOpened():
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame = cv2.resize(frame, (width, height))
            processed_frame = detector.process_frame(frame)
            out.write(processed_frame)
            
            frame_count += 1
            if frame_count % 30 == 0:
                print(f"Processed {frame_count} frames")
        
        cap.release()
        out.release()
        
        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        
        return {
            "status": "completed",
            "file_size_mb": round(file_size_mb, 2)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/download-video")
def download_video():
    return FileResponse("output/processed.mp4", media_type="video/mp4", filename="lanesight_processed_video.mp4")

@app.get("/stream-video")
def stream_video():
    return FileResponse("output/processed.mp4", media_type="video/mp4")

@app.get("/video-info")
def get_video_info():
    output_path = "output/processed.mp4"
    if os.path.exists(output_path):
        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        return {
            "exists": True,
            "file_size_mb": round(file_size_mb, 2),
            "filename": "lanesight_processed_video.mp4"
        }
    return {"exists": False}