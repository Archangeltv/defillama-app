import { lazy, memo, Suspense, useState } from 'react'
import { Icon } from '~/components/Icon'
import type { ChartConfiguration } from '../types'
import { adaptChartData, adaptMultiSeriesData } from '../utils/chartAdapter'
import type { IChartProps, IBarChartProps } from '~/components/ECharts/types'

const AreaChart = lazy(() => import('~/components/ECharts/AreaChart')) as React.FC<IChartProps>
const BarChart = lazy(() => import('~/components/ECharts/BarChart')) as React.FC<IBarChartProps>
const NonTimeSeriesBarChart = lazy(
	() => import('~/components/ECharts/BarChart/NonTimeSeries')
) as React.FC<IBarChartProps>
const LineAndBarChart = lazy(() => import('~/components/ECharts/LineAndBarChart'))
const MultiSeriesChart = lazy(() => import('~/components/ECharts/MultiSeriesChart'))

interface ChartRendererProps {
	charts: ChartConfiguration[]
	chartData: any[]
	isLoading?: boolean
	isAnalyzing?: boolean
	expectedChartCount?: number
	chartTypes?: string[]
}

interface SingleChartProps {
	config: ChartConfiguration
	data: any[]
	isActive: boolean
}

const SingleChart = memo(function SingleChart({ config, data, isActive }: SingleChartProps) {
	if (!isActive) return null

	try {
		const isMultiSeries = config.series && config.series.length > 1
		const adaptedChart = isMultiSeries ? adaptMultiSeriesData(config, data) : adaptChartData(config, data)

		const hasData =
			adaptedChart.chartType === 'multi-series'
				? (adaptedChart.props as any).series?.length > 0
				: adaptedChart.data.length > 0

		if (!hasData) {
			return (
				<div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
					<Icon name="bar-chart" height={24} width={24} className="mb-2" />
					<p>No data available for chart</p>
				</div>
			)
		}

		switch (adaptedChart.chartType) {
			case 'bar':
				const isTimeSeriesChart = config.axes.x.type === 'time'
				return (
					<Suspense fallback={<ChartLoadingSpinner />}>
						{isTimeSeriesChart ? (
							<BarChart chartData={adaptedChart.data} {...(adaptedChart.props as IBarChartProps)} />
						) : (
							<NonTimeSeriesBarChart chartData={adaptedChart.data} {...(adaptedChart.props as IBarChartProps)} />
						)}
					</Suspense>
				)

			case 'line':
			case 'area':
				return (
					<Suspense fallback={<ChartLoadingSpinner />}>
						<AreaChart chartData={adaptedChart.data} {...(adaptedChart.props as IChartProps)} />
					</Suspense>
				)

			case 'combo':
				return (
					<Suspense fallback={<ChartLoadingSpinner />}>
						<MultiSeriesChart {...(adaptedChart.props as any)} />
					</Suspense>
				)

			case 'multi-series':
				return (
					<Suspense fallback={<ChartLoadingSpinner />}>
						<MultiSeriesChart {...(adaptedChart.props as any)} />
					</Suspense>
				)

			default:
				return (
					<div className="flex flex-col items-center justify-center h-full text-red-500">
						<Icon name="alert-triangle" height={24} width={24} className="mb-2" />
						<p>Unsupported chart type: {adaptedChart.chartType}</p>
					</div>
				)
		}
	} catch (error) {
		console.error('Chart render error:', error)
		return (
			<div className="flex flex-col items-center justify-center h-full text-red-500">
				<Icon name="alert-triangle" height={24} width={24} className="mb-2" />
				<p>Chart render failed</p>
				<p className="text-xs mt-1 opacity-75">{error instanceof Error ? error.message : 'Unknown error'}</p>
			</div>
		)
	}
})

const ChartLoadingSpinner = () => (
	<div className="flex items-center justify-center h-full">
		<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary1)]"></div>
	</div>
)

const ChartAnalysisPlaceholder = ({
	expectedChartCount = 1,
	chartTypes
}: {
	expectedChartCount?: number
	chartTypes?: string[]
}) => (
	<div className="mt-4 border border-[var(--cards-border)] rounded-lg overflow-hidden bg-[var(--cards-bg)]">
		<div className="flex items-center justify-between p-3 bg-[var(--bg2)] border-b border-[var(--cards-border)]">
			<div className="flex items-center gap-2">
				<Icon name="search" height={16} width={16} className="text-[var(--primary1)] animate-pulse" />
				<h4 className="text-sm font-medium text-[var(--text1)]">
					Analyzing data for chart opportunities...
				</h4>
			</div>
		</div>

		<div className="p-4">
			<div className="h-32 bg-[var(--bg1)] rounded-lg flex items-center justify-center">
				<div className="text-center">
					<div className="flex justify-center mb-3">
						<ChartLoadingSpinner />
					</div>
					<p className="text-sm text-[var(--text2)]">
						Determining the best visualizations for your data...
					</p>
				</div>
			</div>
		</div>
	</div>
)

const ChartLoadingPlaceholder = ({
	expectedChartCount = 1,
	chartTypes
}: {
	expectedChartCount?: number
	chartTypes?: string[]
}) => (
	<div className="mt-4 border border-[var(--cards-border)] rounded-lg overflow-hidden bg-[var(--cards-bg)]">
		<div className="flex items-center justify-between p-3 bg-[var(--bg2)] border-b border-[var(--cards-border)]">
			<div className="flex items-center gap-2">
				<Icon name="bar-chart" height={16} width={16} className="text-[var(--primary1)] animate-pulse" />
				<h4 className="text-sm font-medium text-[var(--text1)]">
					{expectedChartCount > 1 ? `Generating ${expectedChartCount} Charts...` : 'Generating Chart...'}
				</h4>
			</div>
		</div>

		<div className="p-4">
			<div className="h-64 bg-[var(--bg1)] rounded-lg flex items-center justify-center">
				<div className="text-center">
					<div className="flex justify-center mb-3">
						<ChartLoadingSpinner />
					</div>
					<p className="text-sm text-[var(--text2)]">
						{chartTypes?.length
							? `Creating ${chartTypes.join(', ')} visualization${chartTypes.length > 1 ? 's' : ''}...`
							: 'Creating visualization...'}
					</p>
				</div>
			</div>
		</div>
	</div>
)

export const ChartRenderer = memo(function ChartRenderer({
	charts,
	chartData,
	isLoading = false,
	isAnalyzing = false,
	expectedChartCount,
	chartTypes
}: ChartRendererProps) {
	const [activeTabIndex, setActiveTabIndex] = useState(0)
	const [isCollapsed, setIsCollapsed] = useState(false)

	if (isAnalyzing && (!charts || charts.length === 0)) {
		return <ChartAnalysisPlaceholder expectedChartCount={expectedChartCount} chartTypes={chartTypes} />
	}

	if (isLoading && (!charts || charts.length === 0)) {
		return <ChartLoadingPlaceholder expectedChartCount={expectedChartCount} chartTypes={chartTypes} />
	}

	if (!isLoading && !isAnalyzing && (!charts || charts.length === 0)) {
		return null
	}

	const hasMultipleCharts = charts.length > 1

	return (
		<div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
			<div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-2">
					<Icon name="bar-chart" height={16} width={16} className="text-blue-500" />
					<h4 className="text-sm font-medium text-gray-900 dark:text-white">
						{hasMultipleCharts ? `${charts.length} Charts Generated` : 'Chart Generated'}
					</h4>
				</div>

				<button
					onClick={() => setIsCollapsed(!isCollapsed)}
					className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded"
					title={isCollapsed ? 'Expand charts' : 'Collapse charts'}
				>
					<Icon name={isCollapsed ? 'chevron-right' : 'chevron-down'} height={14} width={14} />
					{isCollapsed ? 'Show' : 'Hide'}
				</button>
			</div>

			{!isCollapsed && (
				<div className="p-4">
					{charts[hasMultipleCharts ? activeTabIndex : 0]?.description && (
						<div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
							<p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
								{charts[hasMultipleCharts ? activeTabIndex : 0].description}
							</p>
						</div>
					)}

					{hasMultipleCharts && (
						<div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
							{charts.map((chart, index) => (
								<button
									key={chart.id}
									onClick={() => setActiveTabIndex(index)}
									className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
										activeTabIndex === index
											? 'border-blue-500 text-blue-600 dark:text-blue-400'
											: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
									}`}
								>
									{chart.title}
								</button>
							))}
						</div>
					)}

					{/* Chart content */}
					<div style={{ height: '300px' }} className="w-full">
						{charts.map((chart, index) => (
							<SingleChart
								key={chart.id}
								config={chart}
								data={chartData}
								isActive={!hasMultipleCharts || activeTabIndex === index}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	)
})
