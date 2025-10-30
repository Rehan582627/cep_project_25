import { useState } from 'react';
import { Camera, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function FoodLabelAnalyzer() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysis(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedImage);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(`Failed to connect to server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Food Label Analyzer
          </h1>
          <p className="text-gray-600">
            Upload a food label image to get instant health analysis
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Upload Image
            </h2>

            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG (MAX. 10MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </label>
            ) : (
              <div className="space-y-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-contain rounded-lg border-2 border-gray-200"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Analyze Label
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Analysis Results
            </h2>

            {!analysis && !loading && (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Upload className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>Upload an image to see analysis</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-3" />
                  <p className="text-gray-600">Analyzing your food label...</p>
                </div>
              </div>
            )}

            {analysis && (
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-800 max-h-96 overflow-y-auto">
                  {analysis}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}