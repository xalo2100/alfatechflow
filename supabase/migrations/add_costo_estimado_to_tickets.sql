-- Add costo_estimado column to tickets table
-- This stores the estimated cost set by admin/sales when creating tickets
-- This cost is internal only and should not be visible to technicians or in client PDFs

ALTER TABLE tickets 
ADD COLUMN costo_estimado DECIMAL(10,2);

COMMENT ON COLUMN tickets.costo_estimado IS 'Estimated cost set by admin/sales - internal use only, hidden from technicians and client PDFs';
