using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Microsoft.ML.OnnxRuntime;
using SixLabors.ImageSharp.PixelFormats;
using Microsoft.ML.OnnxRuntime.Tensors;
using System.Linq;
using System.Collections.Generic;

namespace Detect.Controllers
{
    [ApiController]
    [Route("[controller]")] 
    public class DetectController : ControllerBase
    {
        private const string OnnxModelPath = @"D:\Project\MyProject\ai\predict\ai\predict\models\best.onnx";

        private readonly InferenceSession _onnxSession;

        private const string ModelInputName = "images"; // โดยทั่วไปสำหรับ YOLOv8 คือ "images"
        private const string ModelOutputName = "output0"; // โดยทั่วไปสำหรับ YOLOv8 คือ "output0" (หรืออาจจะเป็น "output")

        private const float ConfidenceThreshold = 0.25f; // ความมั่นใจขั้นต่ำที่ยอมรับได้
        private const float NmsThreshold = 0.45f;       // IoU (Intersection over Union) Threshold สำหรับ Non-Maximum Suppression

        private const int NumClasses = 20;

        private readonly string[] ClassNames = new string[]
        {
            "Deep fired spring roll", "Grilled River Prawn", "Minced pork",
            "Pork Curry with Morning Glory", "egg", "egg and pork in sweet brown sauce",
            "egg with Tamarind Saurce", "fired egg", "fired rice", "golden egg yolk threads",
            "green curry", "lime", "objects", "omelet", "pork chopped tofu soup",
            "shrimp", "sour soup", "spicy minced pork salad", "squid", "steamed Fsh with curry paste"
        };

        public DetectController()
        {
            try
            {
                if (!System.IO.File.Exists(OnnxModelPath))
                {
                    throw new FileNotFoundException($"ONNX model file not found at: {OnnxModelPath}. " +
                                                    "Please ensure 'yolov8n.onnx' is in the application's root directory or specify the full path.");
                }
                _onnxSession = new InferenceSession(OnnxModelPath);
                Console.WriteLine("ONNX model 'yolov8n.onnx' loaded successfully.");

                foreach (var input in _onnxSession.InputMetadata)
                {
                    Console.WriteLine($"- {input.Key} (Type: {input.Value.ElementType}, Dimensions: {string.Join(", ", input.Value.Dimensions)})");
                }
                Console.WriteLine("Model Output Names:");
                foreach (var output in _onnxSession.OutputMetadata)
                {
                    Console.WriteLine($"- {output.Key} (Type: {output.Value.ElementType}, Dimensions: {string.Join(", ", output.Value.Dimensions)})");
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error loading ONNX model: {ex.Message}");
                throw new InvalidOperationException("Failed to initialize ONNX model. See inner exception for details.", ex);
            }
        }
        public class FileUploadModel
        {
            public IFormFile Image { get; set; }
        }
        [HttpPost("detect")]
        [Consumes("multipart/form-data")]
        [Produces("application/json")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)] // เพิ่ม StatusCodes.Status500InternalServerError สำหรับ Exception

        public async Task<IActionResult> UploadImage([FromForm] FileUploadModel model)
        {
            if (model == null || model.Image == null || model.Image.Length == 0)
            {
                return BadRequest(new { error = "No image file uploaded or file is empty." });
            }

            int originalWidth = 0;
            int originalHeight = 0;
            int resizedWidth = 0;
            int resizedHeight = 0;
            Tensor<float> inputTensor = null;
            List<float> firstFewOutputValues = new List<float>(); // สำหรับเก็บผลลัพธ์ดิบจากโมเดล

            List<DetectedObject> detectedObjects = new List<DetectedObject>();

            try
            {
                using (var memoryStream = new MemoryStream())
                {
                    await model.Image.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;

                    using (Image image = Image.Load(memoryStream))
                    {
                        originalWidth = image.Width;
                        originalHeight = image.Height;

                        // เรียกใช้ฟังก์ชันปรับขนาดรูปภาพ
                        // Image.Clone() สร้างสำเนาของรูปภาพ เพื่อให้สามารถประมวลผลต่อได้โดยไม่กระทบกับต้นฉบับ
                        using (Image<Rgb24> resizedImage = ResizeImage(image.CloneAs<Rgb24>(), 640, 640))
                        {
                            resizedWidth = resizedImage.Width;
                            resizedHeight = resizedImage.Height;

                            // ในขั้นตอนนี้ เราจะยังไม่บันทึกรูปภาพที่ปรับขนาดแล้ว
                            // แต่ในอนาคต หากต้องการตรวจสอบรูปภาพที่ปรับขนาด
                            // คุณสามารถบันทึกไปที่ MemoryStream อีกครั้งแล้วส่งกลับได้
                            // หรือบันทึกลงไฟล์ชั่วคราวเพื่อตรวจสอบ
                            inputTensor = ImageToTensor(resizedImage);

                            var input = new List<NamedOnnxValue> { NamedOnnxValue.CreateFromTensor(ModelInputName, inputTensor) };

                            // รันโมเดลและรับผลลัพธ์
                            // ใช้ 'using' เพื่อให้แน่ใจว่าทรัพยากรถูก Dispose อย่างถูกต้อง
                            using (var results = _onnxSession.Run(input))
                            {
                                // ดึงผลลัพธ์จากโมเดล
                                // YOLOv8 มักจะมี Output เดียว
                                var outputTensor = results.FirstOrDefault(o => o.Name == ModelOutputName)?.AsTensor<float>();

                                if (outputTensor == null)
                                {
                                    throw new InvalidOperationException($"Model output '{ModelOutputName}' not found or invalid.");
                                }

                                // *** ขั้นตอนสำคัญ: เรียกใช้ Post-processing ***
                                detectedObjects = PostProcessOutput(outputTensor, originalWidth, originalHeight, resizedWidth, resizedHeight);

                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = $"Failed to process image: {ex.Message}" });
            }

            return Ok(new
            {
                status = "success",
                message = "Object detection completed and results processed.",
                originalWidth = originalWidth,
                originalHeight = originalHeight,
                // ส่งผลลัพธ์การตรวจจับกลับไป
                detectedObjects = detectedObjects
            });
        }
        /// <summary>
        /// ปรับขนาดรูปภาพเป็นขนาดที่กำหนด (width, height)
        /// และแปลงเป็น Pixel Format Rgb24 (ถ้ายังไม่ใช่)
        /// </summary>
        /// <param name="image">รูปภาพต้นฉบับ</param>
        /// <param name="targetWidth">ความกว้างเป้าหมาย</param>
        /// <param name="targetHeight">ความสูงเป้าหมาย</param>
        /// <returns>รูปภาพที่ถูกปรับขนาดแล้ว</returns>
        private Image<Rgb24> ResizeImage(Image<Rgb24> image, int targetWidth, int targetHeight)
        {
            // ใช้ SixLabors.ImageSharp.Processing.Resize() เพื่อปรับขนาดรูปภาพ
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(targetWidth, targetHeight),
                // อาจจะใช้ ResizeMode.Stretch หรือ ResizeMode.Pad หรืออื่นๆ ตามความเหมาะสมของโมเดล YOLO
                // สำหรับ YOLO ส่วนใหญ่มักจะใช้ Stretch หรือ Pad
                // แต่เพื่อความง่ายในตอนนี้ เราจะใช้ Stretch ก่อน
                Mode = ResizeMode.Stretch
            }));
            return image;
        }

        /// <summary>
        /// แปลง Image<Rgb24> ให้เป็น DenseTensor<float>
        /// โดยปรับค่าพิกเซลเป็น 0-1 และจัดเรียงช่องสีเป็น CHW (Channel, Height, Width)
        /// </summary>
        /// <param name="image">รูปภาพที่ถูกปรับขนาดแล้ว</param>
        /// <returns>Tensor<float> สำหรับเป็น Input ให้โมเดล ONNX</returns>
        private DenseTensor<float> ImageToTensor(Image<Rgb24> image)
        {
            // YOLOv8 ต้องการ Input ขนาด [1, 3, H, W] (Batch Size, Channels, Height, Width)
            // ค่าพิกเซลอยู่ในช่วง 0-1 (Normalized)
            var width = image.Width;
            var height = image.Height;
            var tensor = new DenseTensor<float>(new[] { 1, 3, height, width }); // สร้าง Tensor เปล่าๆ ขนาด 1x3xHxW

            image.ProcessPixelRows(accessor =>
            {
                for (int y = 0; y < height; y++)
                {
                    Span<Rgb24> pixelRow = accessor.GetRowSpan(y);
                    for (int x = 0; x < width; x++)
                    {
                        // Normalize ค่าพิกเซลจาก 0-255 เป็น 0-1
                        // จัดเรียงข้อมูลเป็น CHW (Channel, Height, Width)
                        // BGR (OpenCV) หรือ RGB (SixLabors) ขึ้นอยู่กับโมเดล
                        // สำหรับ YOLOv8 ส่วนใหญ่จะใช้ RGB หรือ BGR ขึ้นอยู่กับการเทรน
                        // แต่ ONNX Runtime จะรับตามลำดับที่ส่งให้
                        // เราจะส่งเป็น RGB (R, G, B)
                        tensor[0, 0, y, x] = pixelRow[x].R / 255.0f; // Red channel
                        tensor[0, 1, y, x] = pixelRow[x].G / 255.0f; // Green channel
                        tensor[0, 2, y, x] = pixelRow[x].B / 255.0f; // Blue channel
                    }
                }
            });

            return tensor;
        }
        // เพิ่มคลาสเหล่านี้ในไฟล์ DetectController.cs หรือไฟล์ใหม่ เช่น DetectedObject.cs
        public class DetectedObject
        {
            public int ClassId { get; set; }
            public string ClassName { get; set; } // เราจะกำหนดชื่อคลาสในภายหลัง
            public float Confidence { get; set; }
            public float X { get; set; } // X-coordinate of the top-left corner
            public float Y { get; set; } // Y-coordinate of the top-left corner
            public float Width { get; set; }
            public float Height { get; set; }
        }

        public class BoundingBox
        {
            public float X { get; set; }
            public float Y { get; set; }
            public float Width { get; set; }
            public float Height { get; set; }
            public float Confidence { get; set; }
            public int ClassId { get; set; } // Temporary ID before NMS
        }

        // เพิ่มในคลาส DetectController
        private List<DetectedObject> PostProcessOutput(Tensor<float> outputTensor, int originalWidth, int originalHeight, int resizedWidth, int resizedHeight)
        {
            var detectedObjects = new List<DetectedObject>();
            var boxes = new List<BoundingBox>();

            // Output Tensor Shape: [1, 24, 8400]
            // หรืออาจจะเป็น [1, 8400, 24] ขึ้นอยู่กับการ export โมเดล
            // เราจะสมมติว่าเป็น [1, 24, 8400]
            // ถ้า OutputMetadata.Dimensions เป็น [1, 8400, 24] คุณต้องปรับเปลี่ยนการเข้าถึง array
            // outputTensor.Dimensions จะให้ [1, 24, 8400] หรือ [1, 8400, 24]

            var outputArray = outputTensor.ToArray(); // แปลง Tensor เป็น Array มิติเดียว

            int predictionsCount = outputTensor.Dimensions[2]; // 8400
            int featuresPerPrediction = outputTensor.Dimensions[1]; // 24 (4 bbox + 20 classes)

            // วนลูปผ่านแต่ละ Bounding Box Proposal (8400 กล่อง)
            for (int i = 0; i < predictionsCount; i++)
            {
                // คำนวณ Index เริ่มต้นของข้อมูลสำหรับ BBox Proposal นี้
                // สำหรับรูปร่าง [1, 24, 8400]:
                // Index ของข้อมูลสำหรับกล่องที่ i คือ (feature * predictionsCount + i)
                // หรือถ้าเป็น [1, 8400, 24]:
                // Index ของข้อมูลสำหรับกล่องที่ i คือ (i * featuresPerPrediction + feature)
                // เราจะสมมติเป็น [1, 24, 8400] ซึ่งมักจะเป็นแบบนี้จาก YOLOv8 ONNX
                // ถ้าไม่ถูกต้อง คุณจะต้องปรับเปลี่ยนการเข้าถึง array นี้

                // เราต้องเข้าถึงค่าใน outputArray โดยใช้ Index ที่ถูกต้อง
                // เนื่องจาก outputArray เป็น array มิติเดียว
                // สำหรับ (1, 24, 8400) -> OutputArray[channel_idx * 8400 + bbox_idx]
                // สำหรับ (1, 8400, 24) -> OutputArray[bbox_idx * 24 + channel_idx]

                // ตรวจสอบจาก outputTensorShape ที่คุณได้มา "1x24x8400"
                // ดังนั้น การเข้าถึงค่าจะเป็น outputArray[feature_index * 8400 + i]

                // ดึงพิกัด Bounding Box
                float centerX = outputArray[0 * predictionsCount + i];
                float centerY = outputArray[1 * predictionsCount + i];
                float boxWidth = outputArray[2 * predictionsCount + i];
                float boxHeight = outputArray[3 * predictionsCount + i];

                // หา Confidence Score และ Class ID ที่สูงที่สุด
                float maxClassConfidence = 0;
                int classId = -1;

                for (int c = 0; c < NumClasses; c++)
                {
                    // Index ของ Class Confidence Score: 4 (สำหรับ bbox) + c (สำหรับ class)
                    float classConfidence = outputArray[(4 + c) * predictionsCount + i];
                    if (classConfidence > maxClassConfidence)
                    {
                        maxClassConfidence = classConfidence;
                        classId = c;
                    }
                }

                // กรองด้วย Confidence Threshold
                if (maxClassConfidence >= ConfidenceThreshold)
                {
                    // แปลงพิกัดจาก Center, Width, Height ไปเป็น Top-Left, Bottom-Right
                    // แล้วปรับสเกลให้เข้ากับรูปภาพต้นฉบับ
                    float x1 = (centerX - boxWidth / 2f);
                    float y1 = (centerY - boxHeight / 2f);
                    float x2 = (centerX + boxWidth / 2f);
                    float y2 = (centerY + boxHeight / 2f);

                    // Rescale Bounding Box เพื่อให้ตรงกับขนาดรูปภาพต้นฉบับ
                    // โมเดลทำงานบน 640x640 ดังนั้นต้องปรับ scale กลับมา
                    float scaleX = (float)originalWidth / resizedWidth;
                    float scaleY = (float)originalHeight / resizedHeight;

                    boxes.Add(new BoundingBox
                    {
                        X = x1 * scaleX,
                        Y = y1 * scaleY,
                        Width = (x2 - x1) * scaleX, // (x2-x1) คือ width
                        Height = (y2 - y1) * scaleY, // (y2-y1) คือ height
                        Confidence = maxClassConfidence,
                        ClassId = classId
                    });
                }
            }

            // ทำ Non-Maximum Suppression (NMS)
            // นี่คือส่วนที่ซับซ้อนและต้องใช้การคำนวณ IoU และการเรียงลำดับ
            // เราจะใช้โค้ด NMS แบบง่ายๆ ก่อน หรืออาจจะต้องใช้ไลบรารีช่วย

            // NMS Algorithm (Simplified)
            var filteredBoxes = new List<BoundingBox>();

            // จัดเรียงกล่องตาม Confidence (จากมากไปน้อย)
            boxes = boxes.OrderByDescending(b => b.Confidence).ToList();

            while (boxes.Count > 0)
            {
                var primaryBox = boxes[0];
                filteredBoxes.Add(primaryBox);
                boxes.RemoveAt(0);

                // กรองกล่องที่เหลือที่ซ้อนทับกับ primaryBox มากเกินไป
                boxes.RemoveAll(box =>
                {
                    float iou = CalculateIoU(primaryBox, box);
                    return iou >= NmsThreshold;
                });
            }

            // แปลง BoundingBox ที่ผ่าน NMS แล้ว ให้เป็น DetectedObject
            foreach (var box in filteredBoxes)
            {
                detectedObjects.Add(new DetectedObject
                {
                    ClassId = box.ClassId,
                    ClassName = ClassNames.Length > box.ClassId && box.ClassId >= 0 ? ClassNames[box.ClassId] : "Unknown",
                    Confidence = box.Confidence,
                    X = box.X,
                    Y = box.Y,
                    Width = box.Width,
                    Height = box.Height
                });
            }

            return detectedObjects;
        }

        // ฟังก์ชันสำหรับคำนวณ Intersection over Union (IoU)
        private float CalculateIoU(BoundingBox box1, BoundingBox box2)
        {
            // แปลงจาก (X, Y, Width, Height) เป็น (X1, Y1, X2, Y2)
            float box1_x1 = box1.X;
            float box1_y1 = box1.Y;
            float box1_x2 = box1.X + box1.Width;
            float box1_y2 = box1.Y + box1.Height;

            float box2_x1 = box2.X;
            float box2_y1 = box2.Y;
            float box2_x2 = box2.X + box2.Width;
            float box2_y2 = box2.Y + box2.Height;

            // หาพิกัดของส่วนที่ทับซ้อนกัน (intersection)
            float intersection_x1 = Math.Max(box1_x1, box2_x1);
            float intersection_y1 = Math.Max(box1_y1, box2_y1);
            float intersection_x2 = Math.Min(box1_x2, box2_x2);
            float intersection_y2 = Math.Min(box1_y2, box2_y2);

            // คำนวณพื้นที่ของส่วนที่ทับซ้อนกัน
            float intersection_width = Math.Max(0, intersection_x2 - intersection_x1);
            float intersection_height = Math.Max(0, intersection_y2 - intersection_y1);
            float intersection_area = intersection_width * intersection_height;

            // คำนวณพื้นที่ของแต่ละกล่อง
            float box1_area = box1.Width * box1.Height;
            float box2_area = box2.Width * box2.Height;

            // คำนวณ Union Area
            float union_area = box1_area + box2_area - intersection_area;

            // หลีกเลี่ยงการหารด้วยศูนย์
            if (union_area == 0) return 0;

            return intersection_area / union_area;
        }

    }
}