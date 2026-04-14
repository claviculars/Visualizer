export const parseLogFile = async (fileText) => {
  return new Promise((resolve, reject) => {
    try {
      // 1. Parse JSON
      let result = null;
      // Some logs might have trailing commas or wrapped in unexpected formats, but usually standard JSON
      // If it's a raw .log, we might need to handle huge strings
      const data = JSON.parse(fileText);
      
      const activitiesCsv = data.activitiesLog || "";
      const tradeHistoryRaw = data.tradeHistory || [];
      const lambdaLogsRaw = data.logs || [];
      
      const productsData = {}; // { [product]: [{ timestamp, bid_price_1, ... }] }
      const tradesData = {}; // { [product]: [{ timestamp, price, quantity, type: 'maker' | 'taker' | 'own' }] }
      
      // 2. Parse Activities Log
      if (activitiesCsv) {
        const rows = activitiesCsv.trim().split("\n");
        const headers = rows[0].split(";");
        
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].split(";");
          if (cells.length !== headers.length) continue;
          
          const rowObj = {};
          headers.forEach((h, index) => {
            const val = cells[index];
            rowObj[h] = h === 'product' ? val : (val === '' ? null : Number(val));
          });
          
          const prod = rowObj.product;
          if (!prod) continue;
          
          if (!productsData[prod]) productsData[prod] = [];
          productsData[prod].push(rowObj);
        }
      }
      
      // 3. Parse Trade History
      if (tradeHistoryRaw.length > 0) {
        tradeHistoryRaw.forEach(trade => {
          const prod = trade.symbol;
          if (!prod) return;
          
          if (!tradesData[prod]) tradesData[prod] = [];
          
          let tradeType = 'market';
          if (trade.buyer === "SUBMISSION" || trade.seller === "SUBMISSION") {
            tradeType = 'own';
          }
          // Without depth info we might just classify as 'own' vs 'market'
          // If the user wants maker/taker, we can guess based on execution, but let's stick to 'own' for CROSSES
          
          tradesData[prod].push({
            timestamp: trade.timestamp,
            price: trade.price,
            quantity: trade.quantity,
            type: tradeType,
            buyer: trade.buyer,
            seller: trade.seller,
          });
        });
      }
      
      // 4. Parse Lambda Logs (Optional indicators)
      // lambdaLog -> e.g. "{\"INTARIAN_PEPPER_ROOT\": {\"FAIR\": 11998.5}}"
      const customIndicators = {}; // { [product]: string[] of available indicator keys }
      
      if (lambdaLogsRaw.length > 0) {
        lambdaLogsRaw.forEach(logEntry => {
          if (!logEntry.lambdaLog) return;
          
          try {
            const lLog = JSON.parse(logEntry.lambdaLog);
            const ts = logEntry.timestamp;
            
            // For each product in productsData, try to match lambdaLog entries
            Object.keys(lLog).forEach(prod => {
              if (prod === 'GENERAL') return; // Global logs
              if (productsData[prod]) {
                const targetRow = productsData[prod].find(r => r.timestamp === ts);
                if (targetRow) {
                  // Merge custom keys into targetRow
                  const indicators = lLog[prod];
                  Object.keys(indicators).forEach(indKey => {
                    const mappedKey = `ind_${indKey}`; // prefix to avoid collisions
                    targetRow[mappedKey] = indicators[indKey];
                    
                    if (!customIndicators[prod]) customIndicators[prod] = new Set();
                    customIndicators[prod].add(indKey);
                  });
                }
              }
            });
          } catch (e) {
             // Silently ignore individual lambdaLog parsing errors
          }
        });
      }
      
      // Post-process productsData to clean sets
      const finalProductsData = {};
      const productNames = Object.keys(productsData);
      
      productNames.forEach(prod => {
        const rawTimeline = productsData[prod].sort((a, b) => a.timestamp - b.timestamp);
        const cleanTimeline = [];
        let runningMid = null;
        
        let trailingPos = 0;
        let pIndex = 0;
        const pTrades = tradesData[prod] ? tradesData[prod].sort((a, b) => a.timestamp - b.timestamp) : [];
        
        for (let row of rawTimeline) {
          // Advance pIndex to capture all trades up to and including this row's timestamp
          while (pIndex < pTrades.length && pTrades[pIndex].timestamp <= row.timestamp) {
             const t = pTrades[pIndex];
             if (t.type === 'own') {
                if (t.buyer === "SUBMISSION") trailingPos += t.quantity;
                if (t.seller === "SUBMISSION") trailingPos -= t.quantity;
             }
             pIndex++;
          }

          // Drop pure 0s or mathematically null mid prices immediately
          if (!row.mid_price || row.mid_price <= 0) continue; 
          
          if (runningMid !== null) {
            // Check for massive outliers (e.g., 50% instant drop or spike without real context)
            if (row.mid_price < runningMid * 0.5 || row.mid_price > runningMid * 1.5) {
               continue; // Ignore this chaotic tick to preserve chart panning/smoothing
            }
            // Smoothly adapt the tracking average
            runningMid = runningMid * 0.8 + row.mid_price * 0.2;
          } else {
            runningMid = row.mid_price;
          }
          
          row.position = trailingPos;
          
          cleanTimeline.push(row);
        }

        finalProductsData[prod] = {
          timeline: cleanTimeline,
          trades: tradesData[prod] ? tradesData[prod].sort((a, b) => a.timestamp - b.timestamp) : [],
          indicators: customIndicators[prod] ? Array.from(customIndicators[prod]) : []
        };
      });
      
      resolve({
        products: productNames,
        data: finalProductsData
      });
      
    } catch (error) {
      console.error("Failed to parse log file:", error);
      reject(new Error("Invalid log format. Ensure you have uploaded a valid Prosperity .log or .json file."));
    }
  });
};
