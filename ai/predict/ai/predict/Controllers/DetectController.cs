using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Microsoft.ML.OnnxRuntime;
using SixLabors.ImageSharp.PixelFormats;
using Microsoft.ML.OnnxRuntime.Tensors;
using System.Linq;
using System.Collections.Generic;
using System;
using System.IO;
using System.Text.Json;

namespace Detect.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DetectController : ControllerBase
    {
        // ONNX
        private const string OnnxModelPath = @"D:\Project\MyProject\ai\predict\ai\predict\models\bestv3.onnx";
        private readonly InferenceSession _onnxSession;

        // YOLOv8 I/O
        private const string ModelInputName = "images";
        private const string ModelOutputName = "output0";

        // Thresholds
        private const float ConfidenceThreshold = 0.50f;
        private const float NmsThreshold = 0.45f;

        // Rules config (non-null)
        private readonly CompositionConfig _config = new();

        private void LoadRules(string path)
        {
            if (!System.IO.File.Exists(path))
            {
                Console.WriteLine($"Rules file not found at {path}. Using empty config.");
                return;
            }

            var json = System.IO.File.ReadAllText(path);
            var cfg = JsonSerializer.Deserialize<CompositionConfig>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            if (cfg is not null)
            {
                _config.Aliases = cfg.Aliases ?? new();
                _config.Rules = cfg.Rules ?? new();
            }
            Console.WriteLine($"[Rules] Loaded from {path} (aliases={_config.Aliases.Count}, rules={_config.Rules.Count})");
        }

        private string Normalize(string className)
        {
            if (_config.Aliases is null) return className;
            foreach (var kv in _config.Aliases)
            {
                if (kv.Value.Any(a => string.Equals(a, className, StringComparison.OrdinalIgnoreCase)))
                    return kv.Key;
            }
            return className;
        }

        private bool ClassMatch(string actual, string expected)
            => string.Equals(Normalize(actual), Normalize(expected), StringComparison.OrdinalIgnoreCase);

        private static bool SpatialOk(RequireSpec req, DetectedObject baseObj, DetectedObject other)
        {
            if (req.Spatial is null) return true;

            return req.Spatial.Mode switch
            {
                "inside" => IsContained(other, baseObj),
                "overlap" => IoU(baseObj, other) >= (req.Spatial.Iou ?? 0.1),
                "near" => CenterDistanceRatio(baseObj, other) <= (req.Spatial.MaxCenterDistRatio ?? 0.5),
                _ => true
            };
        }

        // ---------- Geometry helpers ----------
        private static double IoU(DetectedObject a, DetectedObject b)
        {
            var ax2 = a.X + a.Width;
            var ay2 = a.Y + a.Height;
            var bx2 = b.X + b.Width;
            var by2 = b.Y + b.Height;

            var ix1 = Math.Max(a.X, b.X);
            var iy1 = Math.Max(a.Y, b.Y);
            var ix2 = Math.Min(ax2, bx2);
            var iy2 = Math.Min(ay2, by2);

            var iw = Math.Max(0, ix2 - ix1);
            var ih = Math.Max(0, iy2 - iy1);
            var inter = iw * ih;

            var areaA = a.Width * a.Height;
            var areaB = b.Width * b.Height;
            var union = areaA + areaB - inter;

            return union <= 0 ? 0 : inter / union;
        }

        private static double CenterDistanceRatio(DetectedObject a, DetectedObject b)
        {
            var ax = a.X + a.Width / 2.0;
            var ay = a.Y + a.Height / 2.0;
            var bx = b.X + b.Width / 2.0;
            var by = b.Y + b.Height / 2.0;

            var dx = ax - bx;
            var dy = ay - by;
            var dist = Math.Sqrt(dx * dx + dy * dy);

            var diag = Math.Sqrt(a.Width * a.Width + a.Height * a.Height);
            return diag <= 0 ? double.MaxValue : dist / diag;
        }

        private static bool IsContained(DetectedObject inner, DetectedObject outer)
        {
            var innerRight = inner.X + inner.Width;
            var innerBottom = inner.Y + inner.Height;
            var outerRight = outer.X + outer.Width;
            var outerBottom = outer.Y + outer.Height;

            return inner.X >= outer.X &&
                   inner.Y >= outer.Y &&
                   innerRight <= outerRight &&
                   innerBottom <= outerBottom;
        }

        // ---------- Model meta ----------
        private const int NumClasses = 46;

        private readonly string[] ClassNames = new string[]
        {
            "Baked Prawns With Vermiceli",
            "Deep fired spring roll",
            "Grilled River Prawn",
            "Minced pork",
            "Pad Thai",
            "Pork Curry with Morning Glory",
            "Spicy mixed vegetable soup",
            "chicken",
            "chicken panang",
            "coconut rice pancake",
            "cooked rice",
            "egg",
            "egg and pork in sweet brown sauce",
            "egg custard in pumpkin",
            "egg with Tamarind Saurce",
            "fired cabbage with fish sauce",
            "fired egg",
            "fired rice",
            "green curry",
            "green tea",
            "greenpapaya salad",
            "lime",
            "mango",
            "mangosticky rice",
            "omelet",
            "pink milk",
            "pork chopped tofu soup",
            "river prawn spicy soup",
            "shrimp",
            "sour soup",
            "spi",
            "spicy minced pork salad",
            "squid",
            "steamed Fsh with curry paste",
            "steamed capon in flavored rice",
            "sticky rice",
            "stickyrice",
            "stir  fried clams with roasted chill paste",
            "stir-fried Chinese morning glory",
            "stir-fried basil white minced pork",
            "stir-fried pumpkin with eggs",
            "stuffed bitter",
            "stuffed bitter gourd broth",
            "thai chicken biryani",
            "thai chicken coconut soup",
            "thai tea",
            "whipped cream"
        };

        // ---------- ctor ----------
        public DetectController()
        {
            try
            {
                if (!System.IO.File.Exists(OnnxModelPath))
                    throw new FileNotFoundException($"ONNX model file not found at: {OnnxModelPath}.");

                _onnxSession = new InferenceSession(OnnxModelPath);
                Console.WriteLine($"ONNX model '{OnnxModelPath}' loaded successfully.");

                var rulesPath = @"D:\Project\MyProject\ai\predict\ai\predict\datafood\rules.th.json";
                LoadRules(rulesPath);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error loading ONNX model: {ex.Message}");
                throw new InvalidOperationException("Failed to initialize ONNX model. See inner exception for details.", ex);
            }
        }

        // ---------- DTOs ----------
        public class FileUploadModel
        {
            public required IFormFile Image { get; set; }
        }

        public class DetectedObject
        {
            public int ClassId { get; set; }
            public string ClassName { get; set; } = "";
            public float Confidence { get; set; }
            public float X { get; set; }
            public float Y { get; set; }
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
            public int ClassId { get; set; }
        }

        public class ProcessedFoodItem
        {
            public string ClassName { get; set; } = "";
            public Dictionary<string, int> Components { get; set; } = new();
        }

        public class PortionData
        {
            public float WeightG { get; set; }
            public string Unit { get; set; } = "";
            public float Calories { get; set; }
            public float ProteinG { get; set; }
            public float FatG { get; set; }
            public float CarbG { get; set; }
        }

        // ---------- API ----------
        [HttpPost("detect")]
        [RequestSizeLimit(512L * 1024 * 1024)]
        [RequestFormLimits(
            MultipartBodyLengthLimit = 512L * 1024 * 1024,
            ValueLengthLimit = int.MaxValue,
            MultipartHeadersLengthLimit = int.MaxValue,
            MemoryBufferThreshold = int.MaxValue
        )]
        [Consumes("multipart/form-data")]
        [Produces("application/json")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UploadImage([FromForm] FileUploadModel model)
        {
            if (model?.Image is null || model.Image.Length == 0)
                return BadRequest(new { error = "No image file uploaded or file is empty." });

            int originalWidth = 0, originalHeight = 0, resizedWidth = 0, resizedHeight = 0;

            try
            {
                using var memoryStream = new MemoryStream();
                await model.Image.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                using var image = Image.Load(memoryStream);
                originalWidth = image.Width;
                originalHeight = image.Height;

                using var resizedImage = ResizeImage(image.CloneAs<Rgb24>(), 640, 640);
                resizedWidth = resizedImage.Width;
                resizedHeight = resizedImage.Height;

                var inputTensor = ImageToTensor(resizedImage);
                var input = new List<NamedOnnxValue> { NamedOnnxValue.CreateFromTensor(ModelInputName, inputTensor) };

                using var results = _onnxSession.Run(input);
                var outputTensor = results.FirstOrDefault(o => o.Name == ModelOutputName)?.AsTensor<float>();
                if (outputTensor is null)
                    return StatusCode(StatusCodes.Status500InternalServerError,
                        new { error = $"Model output '{ModelOutputName}' not found or invalid." });

                var rawDetectedObjects = PostProcessOutput(outputTensor, originalWidth, originalHeight, resizedWidth, resizedHeight);
                var finalProcessedItems = ProcessAndCombineDetectedObjects(rawDetectedObjects);

                // แปลงชื่อเป็นภาษาไทยสำหรับการแสดงผล (components เป็นไทย, className ถ้าเป็นไทยอยู่แล้วจะไม่ยุ่ง)
                var simplifiedResults = finalProcessedItems.Select(item => new
                {
                    ClassName = LocalizeName(item.ClassName),
                    Components = LocalizeComponents(item.Components)
                }).ToList();

                return Ok(new
                {
                    status = "success",
                    message = "Object detection completed and results processed.",
                    originalWidth,
                    originalHeight,
                    results = simplifiedResults
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Failed to process image: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = $"Failed to process image: {ex.Message}" });
            }
        }

        // ---------- Image/Tensor ----------
        private static Image<Rgb24> ResizeImage(Image<Rgb24> image, int targetWidth, int targetHeight)
        {
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(targetWidth, targetHeight),
                Mode = ResizeMode.Stretch
            }));
            return image;
        }

        private static DenseTensor<float> ImageToTensor(Image<Rgb24> image)
        {
            var width = image.Width;
            var height = image.Height;
            var tensor = new DenseTensor<float>(new[] { 1, 3, height, width });

            image.ProcessPixelRows(accessor =>
            {
                for (int y = 0; y < height; y++)
                {
                    Span<Rgb24> pixelRow = accessor.GetRowSpan(y);
                    for (int x = 0; x < width; x++)
                    {
                        tensor[0, 0, y, x] = pixelRow[x].R / 255.0f;
                        tensor[0, 1, y, x] = pixelRow[x].G / 255.0f;
                        tensor[0, 2, y, x] = pixelRow[x].B / 255.0f;
                    }
                }
            });

            return tensor;
        }

        // ---------- Post-process ----------
        private List<DetectedObject> PostProcessOutput(Tensor<float> outputTensor, int originalWidth, int originalHeight, int resizedWidth, int resizedHeight)
        {
            var boxes = new List<BoundingBox>();
            var outputArray = outputTensor.ToArray();

            int predictionsCount = outputTensor.Dimensions[2]; // e.g., 8400

            for (int i = 0; i < predictionsCount; i++)
            {
                float centerX = outputArray[0 * predictionsCount + i];
                float centerY = outputArray[1 * predictionsCount + i];
                float boxWidth = outputArray[2 * predictionsCount + i];
                float boxHeight = outputArray[3 * predictionsCount + i];

                float maxClassConfidence = 0;
                int classId = -1;

                for (int c = 0; c < NumClasses; c++)
                {
                    float classConfidence = outputArray[(4 + c) * predictionsCount + i];
                    if (classConfidence > maxClassConfidence)
                    {
                        maxClassConfidence = classConfidence;
                        classId = c;
                    }
                }

                if (maxClassConfidence >= ConfidenceThreshold)
                {
                    float x1 = (centerX - boxWidth / 2f);
                    float y1 = (centerY - boxHeight / 2f);

                    float scaleX = (float)originalWidth / resizedWidth;
                    float scaleY = (float)originalHeight / resizedHeight;

                    boxes.Add(new BoundingBox
                    {
                        X = x1 * scaleX,
                        Y = y1 * scaleY,
                        Width = boxWidth * scaleX,
                        Height = boxHeight * scaleY,
                        Confidence = maxClassConfidence,
                        ClassId = classId
                    });
                }
            }

            // NMS
            boxes = boxes.OrderByDescending(b => b.Confidence).ToList();
            var filtered = new List<BoundingBox>();

            while (boxes.Count > 0)
            {
                var primary = boxes[0];
                filtered.Add(primary);
                boxes.RemoveAt(0);

                boxes.RemoveAll(box => CalculateIoU(primary, box) >= NmsThreshold);
            }

            var detectedObjects = new List<DetectedObject>();
            foreach (var box in filtered)
            {
                if (box.ClassId >= 0 && box.ClassId < ClassNames.Length)
                {
                    detectedObjects.Add(new DetectedObject
                    {
                        ClassId = box.ClassId,
                        ClassName = ClassNames[box.ClassId],
                        Confidence = box.Confidence,
                        X = box.X,
                        Y = box.Y,
                        Width = box.Width,
                        Height = box.Height
                    });
                }
                else
                {
                    Console.WriteLine($"Warning: ClassId {box.ClassId} out of bounds.");
                    detectedObjects.Add(new DetectedObject
                    {
                        ClassId = box.ClassId,
                        ClassName = "Unknown",
                        Confidence = box.Confidence,
                        X = box.X,
                        Y = box.Y,
                        Width = box.Width,
                        Height = box.Height
                    });
                }
            }

            return detectedObjects;
        }

        private static float CalculateIoU(BoundingBox box1, BoundingBox box2)
        {
            float ix1 = Math.Max(box1.X, box2.X);
            float iy1 = Math.Max(box1.Y, box2.Y);
            float ix2 = Math.Min(box1.X + box1.Width, box2.X + box2.Width);
            float iy2 = Math.Min(box1.Y + box1.Height, box2.Y + box2.Height);

            float iw = Math.Max(0, ix2 - ix1);
            float ih = Math.Max(0, iy2 - iy1);
            float inter = iw * ih;

            float area1 = box1.Width * box1.Height;
            float area2 = box2.Width * box2.Height;
            float union = area1 + area2 - inter;

            return union == 0 ? 0 : inter / union;
        }

        // ---------- Rules schema ----------
        public class CompositionConfig
        {
            public Dictionary<string, List<string>> Aliases { get; set; } = new();
            public List<DishRule> Rules { get; set; } = new();
        }

        public class DishRule
        {
            public string Id { get; set; } = "";
            public string OutputClass { get; set; } = "";
            public int Priority { get; set; } = 0;
            public bool ReuseComponents { get; set; } = false;
            public BaseSpec Base { get; set; } = new();
            public List<RequireSpec> Requires { get; set; } = new();
            public ConfidenceSpec? Confidence { get; set; }
        }

        public class BaseSpec { public string Class { get; set; } = ""; }

        public class RequireSpec
        {
            public string Class { get; set; } = "";
            public int MinCount { get; set; } = 1;
            public SpatialSpec? Spatial { get; set; }
        }

        public class SpatialSpec
        {
            public string Mode { get; set; } = "inside"; // inside | overlap | near
            public double? Iou { get; set; }
            public double? MaxCenterDistRatio { get; set; }
        }

        public class ConfidenceSpec { public double Min { get; set; } = 0.0; }

        // ---------- Merge helpers ----------
        private static List<ProcessedFoodItem> MergeSameOutputClasses(List<ProcessedFoodItem> items)
        {
            var merged = new Dictionary<string, Dictionary<string, int>>(StringComparer.OrdinalIgnoreCase);

            foreach (var it in items)
            {
                if (!merged.TryGetValue(it.ClassName, out var comp))
                {
                    comp = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                    merged[it.ClassName] = comp;
                }

                foreach (var kv in it.Components)
                {
                    if (comp.TryGetValue(kv.Key, out var cur))
                        comp[kv.Key] = cur + kv.Value;
                    else
                        comp[kv.Key] = kv.Value;
                }
            }

            return merged.Select(kv => new ProcessedFoodItem
            {
                ClassName = kv.Key,
                Components = new Dictionary<string, int>(kv.Value)
            }).ToList();
        }

        // ---------- Combine rules ----------
        private List<ProcessedFoodItem> ProcessAndCombineDetectedObjects(List<DetectedObject> detectedObjects)
        {
            var processedItems = new List<ProcessedFoodItem>();
            var isObjectUsed = new bool[detectedObjects.Count];

            // sort by confidence
            detectedObjects = detectedObjects.OrderByDescending(o => o.Confidence).ToList();

            // normalize class names
            foreach (var o in detectedObjects)
                o.ClassName = Normalize(o.ClassName);

            // rules pass
            foreach (var rule in _config.Rules.OrderByDescending(r => r.Priority))
            {
                for (int i = 0; i < detectedObjects.Count; i++)
                {
                    if (isObjectUsed[i]) continue;
                    var baseObj = detectedObjects[i];

                    if (!ClassMatch(baseObj.ClassName, rule.Base.Class)) continue;
                    if (rule.Confidence is not null && baseObj.Confidence < rule.Confidence.Min) continue;

                    var componentCounts = new Dictionary<string, int> { [baseObj.ClassName] = 1 };
                    var indicesToUse = new HashSet<int>();
                    var matchedAll = true;

                    foreach (var req in rule.Requires)
                    {
                        int found = 0;

                        // นับ "ให้หมด" ไม่หยุดแค่ถึง MinCount
                        for (int j = 0; j < detectedObjects.Count; j++)
                        {
                            if (i == j) continue;
                            if (!rule.ReuseComponents && isObjectUsed[j]) continue;

                            var other = detectedObjects[j];
                            if (!ClassMatch(other.ClassName, req.Class)) continue;
                            if (rule.Confidence is not null && other.Confidence < rule.Confidence.Min) continue;
                            if (!SpatialOk(req, baseObj, other)) continue;

                            found++;
                            indicesToUse.Add(j); // เก็บไว้ mark used ภายหลัง
                        }

                        // ถ้าพบน้อยกว่าที่กำหนด ถือว่าไม่ผ่านกฎนี้
                        if (found < req.MinCount) { matchedAll = false; break; }

                        // บันทึกจำนวนทั้งหมดที่นับได้ (เช่น shrimp = 3)
                        componentCounts[Normalize(req.Class)] = found;
                    }

                    if (!matchedAll) continue;

                    if (rule.OutputClass == "_IGNORE_")
                    {
                        isObjectUsed[i] = true;
                        foreach (var idx in indicesToUse) isObjectUsed[idx] = true;
                        continue;
                    }

                    processedItems.Add(new ProcessedFoodItem
                    {
                        ClassName = rule.OutputClass,
                        Components = new(componentCounts)
                    });

                    // mark used ทั้ง base และ components ที่นับไปแล้ว
                    isObjectUsed[i] = true;
                    foreach (var idx in indicesToUse) isObjectUsed[idx] = true;
                }
            }

            // standalone pass (จะไม่เจอ component ที่ถูกใช้ไปแล้ว)
            for (int i = 0; i < detectedObjects.Count; i++)
            {
                if (!isObjectUsed[i])
                {
                    var o = detectedObjects[i];
                    processedItems.Add(new ProcessedFoodItem
                    {
                        ClassName = o.ClassName,
                        Components = new() { [o.ClassName] = 1 }
                    });
                }
            }

            return MergeSameOutputClasses(processedItems);
        }

        // ---------- Display name helpers (เลือกชื่อไทยเป็นหลัก) ----------
        private static bool ContainsThai(string s)
            => !string.IsNullOrEmpty(s) && s.Any(ch => ch >= '\u0E00' && ch <= '\u0E7F');

        private string CanonicalToDisplay(string canonical)
        {
            if (_config.Aliases != null &&
                _config.Aliases.TryGetValue(canonical, out var list) &&
                list is { Count: > 0 })
            {
                var thai = list.FirstOrDefault(ContainsThai);
                if (!string.IsNullOrWhiteSpace(thai))
                    return thai;
                return list[0];
            }
            return canonical;
        }

        private string LocalizeName(string name)
        {
            if (ContainsThai(name)) return name;

            var canonical = Normalize(name);
            return CanonicalToDisplay(canonical);
        }

        private Dictionary<string, int> LocalizeComponents(Dictionary<string, int> comps)
        {
            var dict = new Dictionary<string, int>();
            foreach (var kv in comps)
                dict[LocalizeName(kv.Key)] = kv.Value;
            return dict;
        }
    }
}
