import { useState, useCallback } from 'react';
import { Scale, Info } from 'lucide-react';
import { WeightDisplay } from './components/WeightDisplay';
import { Controls } from './components/Controls';
import { ErrorChart } from './components/ErrorChart';
import { ProductionSetup } from './components/ProductionSetup';
import { ProductionAnimation } from './components/ProductionAnimation';
import { CalibrationAnimation } from './components/CalibrationAnimation';
import { generateParts, takeSample, weighSample, calibrate } from './utils/simulation';
import type { Part, WeighingResult, CalibrationResult, ProductionConfig } from './types';

export default function App() {
  const [parts, setParts] = useState<Part[]>([]);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [result, setResult] = useState<WeighingResult | null>(null);
  const [isWeighing, setIsWeighing] = useState(false);
  const [isProducing, setIsProducing] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [currentProductionConfig, setCurrentProductionConfig] = useState<ProductionConfig | null>(null);

  const handleProduction = useCallback(async (config: ProductionConfig) => {
    setCurrentProductionConfig(config);
    setIsProducing(true);
    setShowAnimation(true);
    setCalibration(null);
    setResult(null);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    if (!currentProductionConfig) {
      console.error('Keine Produktionskonfiguration vorhanden');
      return;
    }

    const newParts = generateParts({
      totalParts: currentProductionConfig.totalParts,
      distribution: currentProductionConfig.distribution,
      manualGroups: currentProductionConfig.manualGroups,
      normalMean: currentProductionConfig.normalMean,
      normalDeviation: currentProductionConfig.normalDeviation
    });
    setParts(newParts);
    setShowAnimation(false);
    setIsProducing(false);
  }, [currentProductionConfig]);

  const handleCalibrate = useCallback(async (referenceParts: number) => {
    if (parts.length === 0) return;
    
    setIsWeighing(true);
    setShowCalibration(true);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const sample = takeSample(parts, referenceParts);
    const calibrationResult = calibrate(sample, referenceParts);
    
    setResult(null);
    setIsWeighing(false);
    setShowCalibration(false);
  }, [parts]);

  const handleWeigh = useCallback(async (sampleSize: number) => {
    if (!calibration || parts.length === 0) return;
    
    setIsWeighing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const sample = takeSample(parts, sampleSize);
    const weighResult =  weighSample(parts, calibration);
    
    setResult(weighResult);
    setIsWeighing(false);
  }, [parts, calibration]);

  const handleReset = useCallback(() => {
    setParts([]);
    setCalibration(null);
    setResult(null);
    setShowAnimation(false);
    setShowCalibration(false);
  }, []);

  const handleCalibrationComplete = useCallback(() => {
    setShowCalibration(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 transition-all duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Digitale Präzisions-Zählwaage
          </h1>
          <div className="relative inline-block">
            <button
              onClick={() => setShowSpecs(!showSpecs)}
              className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-2"
            >
              <Info className="w-5 h-5" />
              <span>Technische Daten</span>
            </button>
            {showSpecs && (
              <div className="absolute z-10 mt-2 p-4 bg-white rounded-lg shadow-xl border border-gray-200 text-left w-64">
                <h3 className="font-semibold mb-2">Spezifikationen:</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Messbereich: 0.1g - 30kg</li>
                  <li>• Auflösung: 0.1g</li>
                  <li>• Kalibriergenauigkeit: ±0.1%</li>
                  <li>• Wiederholgenauigkeit: ±0.05g</li>
                </ul>
              </div>
            )}
          </div>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Hochpräzise Simulationsumgebung für industrielle Zählprozesse. 
            Entwickelt für Schulung und Prozessoptimierung in der Qualitätskontrolle.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ProductionSetup 
              onProduction={handleProduction}
              isProducing={isProducing}
            />
            {parts.length > 0 && (
              <Controls 
                onWeigh={handleWeigh}
                onCalibrate={handleCalibrate}
                onReset={handleReset}
                isWeighing={isWeighing}
                isCalibrated={!!calibration}
                totalParts={parts.length}
              />
            )}
          </div>
          <div>
            {showAnimation ? (
              <ProductionAnimation
                isActive={showAnimation}
                totalParts={currentProductionConfig?.totalParts || 1000}
                onComplete={handleAnimationComplete}
              />
            ) : showCalibration ? (
              <CalibrationAnimation
                isActive={showCalibration}
                onComplete={handleCalibrationComplete}
              />
            ) : (
              <WeightDisplay 
                result={result} 
                calibration={calibration}
                isWeighing={isWeighing}
              />
            )}
          </div>
        </div>

        {result && (
          <div className="mt-8 -mx-4 px-4 py-6 bg-white shadow-lg rounded-lg">
            <ErrorChart result={result} />
          </div>
        )}

        <footer className="text-center text-sm text-gray-500 mt-12">
          <p>Simulationsversion 2.0 - Entwickelt für Schulung und Prozessoptimierung</p>
        </footer>
      </div>
    </div>
  );
}
