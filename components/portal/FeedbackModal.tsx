"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useSubmitPortalFeedback } from "@/hooks/use-portal";
import type { FeedbackRelatedType } from "@/lib/api";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  relatedType: FeedbackRelatedType;
  relatedId: string;
}

export function FeedbackModal({ open, onClose, projectId, relatedType, relatedId }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const submitFeedback = useSubmitPortalFeedback();

  if (!open) return null;

  const displayRating = hovered || rating;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How did that go?"
      size="sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button
            type="button"
            disabled={rating === 0}
            loading={submitFeedback.isPending}
            onClick={() => {
              submitFeedback.mutate(
                { project_id: projectId, related_type: relatedType, related_id: relatedId, rating },
                { onSuccess: onClose }
              );
            }}
          >
            Submit
          </Button>
        </>
      }
    >
      <div className="flex justify-center gap-1 py-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            className="p-1"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                value <= displayRating ? "fill-(--warning) text-(--warning)" : "text-(--border)"
              }`}
            />
          </button>
        ))}
      </div>
    </Modal>
  );
}
