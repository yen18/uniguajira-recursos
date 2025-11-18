import React, { useMemo } from 'react';
import { Card, CardActionArea, CardContent, Box, Typography, Avatar, Skeleton, useTheme } from '@mui/material';
import { ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';

/* StatCard
   Props: title, value, subtitle, badge, icon, color (palette key), loading, onClick, clickable, trendData (array of numbers)
*/
export default function StatCard({ title, value, subtitle, badge, icon, color = 'primary', loading, onClick, clickable = true, trendData = [] }) {
  const theme = useTheme();
  const chartData = trendData.map((v, i) => ({ i, v }));
  const showChart = chartData.length >= 2; // mínimo dos puntos para área
  const avg = useMemo(() => chartData.reduce((a,c)=>a+c.v,0) / (chartData.length || 1), [chartData]);
  const last = trendData[trendData.length - 1];
  const prev = trendData[trendData.length - 2];
  const diff = prev != null && last != null ? last - prev : 0;
  const diffLabel = diff === 0 ? '↔' : diff > 0 ? `↑ ${diff}` : `↓ ${Math.abs(diff)}`;

  return (
    <Card sx={{
      height: '100%',
      borderLeft: `4px solid ${theme.palette[color].main}`,
      cursor: clickable ? 'pointer' : 'default',
      transition: `box-shadow 180ms ${theme.transitions?.easing?.easeInOut || 'cubic-bezier(0.4,0,0.2,1)'}, transform 180ms ease`,
      position: 'relative',
      overflow: 'visible',
      '&:hover': clickable ? {
        transform: 'translateY(-6px)',
        boxShadow: '0 8px 22px rgba(0,0,0,0.12)',
        borderLeft: `6px solid ${theme.palette[color].main}`,
      } : {},
      '&:active': clickable ? { transform: 'translateY(-2px)' } : {}
    }}>
      <CardActionArea onClick={clickable ? onClick : undefined} disabled={!clickable} sx={{ height: '100%' }}>
        <CardContent sx={{ position: 'relative', pb: showChart ? 2 : 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box>
              <Typography color="textSecondary" gutterBottom variant="subtitle2" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              {loading ? (
                <Skeleton variant="text" width={64} height={40} />
              ) : (
                <Typography variant="h4" component="div" color={color} sx={{ fontWeight: 700, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: .75 }}>
                  <span>{value}</span>
                  {showChart && (
                    <Typography component="span" variant="caption" sx={{ fontWeight: 600, color: diff > 0 ? theme.palette.success.main : diff < 0 ? theme.palette.error.main : theme.palette.text.secondary }}>
                      {diffLabel}
                    </Typography>
                  )}
                </Typography>
              )}
              {subtitle && (
                loading ? <Skeleton variant="text" width={100} /> : (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: .5, display: 'block' }}>
                    {subtitle}
                  </Typography>
                )
              )}
              {badge}
              {clickable && (
                <Typography variant="caption" sx={{ color: theme.palette[color].main, fontWeight: 600, mt: .75, display: 'block' }}>
                  Ver detalles →
                </Typography>
              )}
            </Box>
            <Avatar sx={{
              bgcolor: theme.palette[color].main,
              width: 48,
              height: 48,
              boxShadow: `0 4px 10px ${theme.palette[color].main}40`
            }}>
              {icon}
            </Avatar>
          </Box>
          {showChart && (
            <Box sx={{ position: 'absolute', bottom: 8, left: 8, right: 8, height: 50, opacity: loading ? 0.4 : 1 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 2, left: 0, right: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.palette[color].main} stopOpacity={0.6} />
                      <stop offset="100%" stopColor={theme.palette[color].main} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <ReferenceLine y={avg} stroke={theme.palette[color].main} strokeDasharray="3 3" ifOverflow="extendDomain" />
                  <Area type="monotone" dataKey="v" stroke={theme.palette[color].main} strokeWidth={2} fill={`url(#grad-${title})`} animationDuration={240} isAnimationActive={!window.matchMedia('(prefers-reduced-motion: reduce)').matches} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
