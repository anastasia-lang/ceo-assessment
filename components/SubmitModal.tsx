'use client';

interface SubmitModalProps {
  stage: number;
  isLast: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SubmitModal({ stage, isLast, onConfirm, onCancel }: SubmitModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {isLast ? 'Submit Assessment?' : `Submit Stage ${stage}?`}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {isLast
            ? "This will complete your assessment. You won't be able to make changes after submission."
            : `Once submitted, you cannot go back to Stage ${stage}. You'll move on to Stage ${stage + 1}.`}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-[#e94560] text-white text-sm font-medium rounded-lg hover:bg-[#d63d56] transition-colors"
          >
            {isLast ? 'Submit Assessment' : 'Submit & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
