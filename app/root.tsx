import type { LinksFunction, MetaFunction } from '@remix-run/node'
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration
} from '@remix-run/react'

import { ErrorPopup } from '~/components/Error'
import { Toaster } from '~/components/Toaster'
import stylesheet from '~/tailwind.css?url'
import { getContext, registerConfigWatcher } from '~/utils/config'

export const meta: MetaFunction = () => [
	{ title: 'Headplane' },
	{ name: 'description', content: 'A frontend for the headscale coordination server' }
]

export const links: LinksFunction = () => [
	{ rel: 'stylesheet', href: stylesheet }
]

export async function loader() {
	const context = await getContext()
	registerConfigWatcher()

	if (context.headscaleUrl.length === 0) {
		throw new Error('No headscale URL was provided either by the HEADSCALE_URL environment variable or the config file')
	}

	if (!process.env.COOKIE_SECRET) {
		throw new Error('The COOKIE_SECRET environment variable is required')
	}

	// eslint-disable-next-line unicorn/no-null
	return null
}

export function Layout({ children }: { readonly children: React.ReactNode }) {
	return (
		<html lang='en'>
			<head>
				<meta charSet='utf-8'/>
				<meta name='viewport' content='width=device-width, initial-scale=1'/>
				<Meta/>
				<Links/>
			</head>
			<body className='overscroll-none dark:bg-ui-950 dark:text-ui-50'>
				{children}
				<Toaster/>
				<ScrollRestoration/>
				<Scripts/>
			</body>
		</html>
	)
}

export function ErrorBoundary() {
	return <ErrorPopup/>
}

export default function App() {
	return <Outlet/>
}
