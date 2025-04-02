// 전체 코드 복구 + 일자별/플랫폼/소재별 그래프 기본 포함

import React, { useState, useMemo, useRef, useEffect } from "react"; // useRef, useEffect 추가
import './App.css';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

const formatNumber = (num) => new Intl.NumberFormat().format(num);
const getCTR = (clicks, impressions) => (!impressions ? "0%" : ((clicks / impressions) * 100).toFixed(2) + "%");

const generateTestData = () => [
  { date: "2025-03-18", platform: "Meta", creative: "봄이벤트A", cost: 300000, clicks: 2500, impressions: 100000, signups: 80, comment: "" },
  { date: "2025-03-18", platform: "Google", creative: "눈성형", cost: 250000, clicks: 2300, impressions: 90000, signups: 70, comment: "" },
  { date: "2025-03-18", platform: "TikTok", creative: "리프팅광고B", cost: 200000, clicks: 2100, impressions: 85000, signups: 60, comment: "" },
  { date: "2025-03-19", platform: "Meta", creative: "봄이벤트B", cost: 320000, clicks: 2700, impressions: 110000, signups: 85, comment: "" },
  { date: "2025-03-19", platform: "Google", creative: "코성형", cost: 280000, clicks: 2400, impressions: 92000, signups: 75, comment: "" },
];

function App() {
  const [data, setData] = useState(generateTestData());
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [editingDateIndex, setEditingDateIndex] = useState(null);
  const dateInputRef = useRef(null); // 🔧 input 참조용
  const [selectedPlatformMetrics, setSelectedPlatformMetrics] = useState(["cost", "impressions", "clicks"]);
  const [selectedCreativeMetrics, setSelectedCreativeMetrics] = useState(["cost", "impressions", "clicks"]);
  const defaultMetrics = ["cost", "impressions", "clicks"];
  const [visibleGraphMetrics, setVisibleGraphMetrics] = useState(defaultMetrics);
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
    

  useEffect(() => {
    function handleClickOutside(e) {
      if (dateInputRef.current && !dateInputRef.current.contains(e.target)) {
        setEditingDateIndex(null);
      }
    }
  
    if (editingDateIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingDateIndex]);

  const handleCellChange = (key, value, index) => {
    const updatedData = [...data];
    updatedData[index][key] = ["cost", "revenue", "clicks", "impressions", "signups"].includes(key) ? Number(value) : value;
    setData(updatedData);
  };

  const handleRowSelect = (index) => {
    setSelectedRows((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  const handleAddRow = () => {
    const newRow = { date: "", platform: "", creative: "", cost: 0, clicks: 0, impressions: 0, signups: 0, comment: "" };
    setData((prev) => [...prev, newRow]);
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      alert("삭제할 데이터를 선택해주세요");
      return;
    }
    if (window.confirm("선택한 데이터를 정말 삭제하시겠습니까?")) {
      setData((prev) => prev.filter((_, idx) => !selectedRows.includes(idx)));
      setSelectedRows([]);
    }
  };

  const handleSave = () => {
    setData([...data]);
    setSelectedRows([]);
  };

  const handleExportCSV = () => {
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((key) => row[key]).join(","));
    const csvContent = [headers.join(","), ...rows].join("\n");
    saveAs(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), "ad_data.csv");
  };

  const handleExportJSON = () => {
    saveAs(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), "ad_data.json");
  };

  const filteredSortedData = useMemo(() => {
    let sorted = [...data];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (typeof valA === "string") return sortConfig.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      });
    }
    return sorted.filter((d) => {
      const date = dayjs(d.date);
      const from = dateFilter.from ? dayjs(dateFilter.from) : null;
      const to = dateFilter.to ? dayjs(dateFilter.to) : null;
      return (!from || date.isAfter(from.subtract(1, 'day'))) && (!to || date.isBefore(to.add(1, 'day')));
    });
  }, [data, sortConfig, dateFilter]);

  const groupBy = (key, dataset = filteredSortedData) => {
    const result = {};
    dataset.forEach((item) => {
      const k = item[key];
      if (!result[k]) result[k] = { label: k, cost: 0, clicks: 0, signups: 0 };
      result[k].cost += item.cost;
      result[k].clicks += item.clicks;
      result[k].signups += item.signups;
    });
    return Object.values(result);
  };
  const [searchDateFilter, setSearchDateFilter] = useState({ from: '', to: '' });
  const getDateAggregatedData = () => {
    const result = {};
    filteredSortedData.forEach((item) => {
      const d = item.date;
      if (!result[d]) {
        result[d] = { date: d, cost: 0, impressions: 0, clicks: 0, signups: 0 };
      }
      result[d].cost += item.cost;
      result[d].impressions += item.impressions;
      result[d].clicks += item.clicks;
      result[d].signups += item.signups;
    });
    return Object.values(result);
  };

  const platformData = groupBy("platform");
  const creativeData = groupBy("creative");

  const columnDefs = [
    { label: "날짜", key: "date" },
    { label: "플랫폼", key: "platform" },
    { label: "광고소재", key: "creative" },
    { label: "광고비", key: "cost" },
    { label: "노출", key: "impressions" },
    { label: "클릭수", key: "clicks" },
    { label: "CTR", key: "CTR" },
    { label: "회원가입", key: "signups" },
    { label: "코멘트", key: "comment" },
  ];

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>
  <img src="/images/logo2.png" alt="BYUL Beauty Clinic Logo" className="logo" />
</h1>

<div className="chart-header">
  <h3 style={{ margin: 0 }}>📈 일자별 합계 그래프</h3>
  <div className="controls">
    <input
      type="date"
      value={searchDateFilter.from}
      onChange={(e) => setSearchDateFilter(prev => ({ ...prev, from: e.target.value }))}
    />
    <input
      type="date"
      value={searchDateFilter.to}
      onChange={(e) => setSearchDateFilter(prev => ({ ...prev, to: e.target.value }))}
    />
    <button className="btn-search" onClick={() => setDateFilter(searchDateFilter)}>🔍 검색</button>
    <button className="btn-csv" onClick={handleExportCSV}>🟩 CSV</button>
    <button className="btn-json" onClick={handleExportJSON}>📄 JSON</button>
  </div>
</div>

      <div style={{ marginBottom: 12 }}>
      {defaultMetrics.map((metric) => (
      <label key={metric} style={{ marginRight: "12px" }}>
      <input
      type="checkbox"
      checked={visibleGraphMetrics.includes(metric)}
      onChange={() =>
        setVisibleGraphMetrics((prev) =>
          prev.includes(metric)
            ? prev.filter((m) => m !== metric)
            : [...prev, metric]
        )
      }
    /> {metric}
  </label>
))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={getDateAggregatedData()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Legend />
          {defaultMetrics.map((metric, idx) => (
            <Bar key={idx} yAxisId="left" dataKey={metric} barSize={20} fill={"#8884d8"} name={metric} hide={!visibleGraphMetrics.includes(metric)}/>
          ))}
          <Line yAxisId="right" type="monotone" dataKey="signups" stroke="#ff7300" name="회원가입" />
        </ComposedChart>
      </ResponsiveContainer>

      <h3 style={{ marginTop: 40 }}>📋 데이터 테이블</h3>
      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead>
          <tr>
            <th></th>
            {columnDefs.map(({ label, key }) => (
              <th key={key}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredSortedData.map((item, i) => (
            <tr key={i}>

              <td style={{ textAlign: "center", height: "40px", padding: 0, width: "40px" }}>
                <input
                  type="checkbox"
                      checked={selectedRows.includes(i)}
                      onChange={() => handleRowSelect(i)}
                      style={{ transform: "scale(1.2)" }} // 💡 보기 좋게 키워도 OK
                />
              </td>
              {columnDefs.map(({ key }) => {
                let val = key === "CTR" ? getCTR(item.clicks, item.impressions) : item[key];
                if (["cost", "clicks", "impressions", "signups"].includes(key)) {
                  val = formatNumber(val);
                }
                return (
                  <td key={key} style={{ textAlign: "center", height: "40px", padding: 0 , width: key === "comment" ? "220px" : "120px" }}>
                    {key === "date" ? (
                      editingDateIndex === i ? (
                        <input
                        type="date"
                        ref={dateInputRef}
                        value={item.date}
                        onChange={(e) => handleCellChange("date", e.target.value, i)} 
                        onBlur={(e) => {
                          handleCellChange("date", e.target.value, i);
                          // setEditingDateIndex(null); <-- 이제 외부 클릭에서 처리됨
                        }}
                        onBlur={() => {
                          setEditingDateIndex(null);
                        }}
          autoFocus
          style={{
            width: "100%",
            height: "100%",
            fontSize: "14px",
            padding: "6px",
            border: "none",
            boxSizing: "border-box",
            textAlign: "center",
            backgroundColor: "#fff",
            outline: "none",
            overflow: "hidden",         // ✅ 핵심: 내용 넘치지 않게
            textOverflow: "ellipsis",
          }}
        />
      ) : (
        <div
        onClick={() => setEditingDateIndex(i)}
        style={{
          cursor: "pointer",
          padding: "6px",
          fontSize: "14px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {item.date}
      </div>
      )
      ) : key === "comment" ? (
        <textarea
          value={item.comment}
          onChange={(e) => handleCellChange("comment", e.target.value, i)}
          maxLength={200}
          style={{   
            width: "100%",
            minHeight: "60px",
            resize: "none",
            fontSize: "14px",
            padding: "6px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            boxSizing: "border-box", }}
        />
      ) : (
                    
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        handleCellChange(key, e.target.innerText.replace(/,/g, ""), i)
                      }
                      dangerouslySetInnerHTML={{ __html: val }}
                    />
                  )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12 }}>
      <button className="btn-add" onClick={handleAddRow}>+ 행 추가</button>
      <button className="btn-delete" onClick={handleDelete}>🗑 선택 삭제</button>
      </div>

      <h3 style={{ marginTop: 40 }}>📊 플랫폼별 집계</h3>
      <div style={{ marginBottom: "20px" }}>
      {["cost", "impressions", "clicks"].map((metric) => (
  <label key={metric} style={{ marginRight: "12px" }}>
    <input
      type="checkbox"
      checked={selectedPlatformMetrics.includes(metric)}
      onChange={() =>
        setSelectedPlatformMetrics((prev) =>
          prev.includes(metric)
            ? prev.filter((m) => m !== metric)
            : [...prev, metric]
        )
      }
    />{" "}
    {metric}
  </label>
))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={platformData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Legend />
          {selectedPlatformMetrics.map((metric, idx) => (
            <Bar key={idx} yAxisId="left" dataKey={metric} barSize={20} fill={"#82ca9d"} name={metric} />
          ))}
          <Line yAxisId="right" type="monotone" dataKey="signups" stroke="#ff7300" name="회원가입" />
        </ComposedChart>
      </ResponsiveContainer>

      <h3 style={{ marginTop: 40 }}>🎨 광고소재별 집계</h3>
      <div style={{ marginBottom: "20px" }}>
      {["cost", "impressions", "clicks"].map((metric) => (
  <label key={metric} style={{ marginRight: "12px" }}>
    <input
      type="checkbox"
      checked={selectedCreativeMetrics.includes(metric)}
      onChange={() =>
        setSelectedCreativeMetrics((prev) =>
          prev.includes(metric)
            ? prev.filter((m) => m !== metric)
            : [...prev, metric]
        )
      }
      />{" "}
    {metric}
  </label>
))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={groupBy("creative")}> 
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Legend />
          {selectedCreativeMetrics.map((metric, idx) => (
            <Bar key={idx} yAxisId="left" dataKey={metric} barSize={20} fill={"#ffc658"} name={metric} />
          ))}
          <Line yAxisId="right" type="monotone" dataKey="signups" stroke="#ff7300" name="회원가입" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default App;