/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { InfoIcon } from '@primer/octicons-react'
import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { Button, Tooltip, TooltipTrigger } from 'react-aria-components'

import Code from '~/components/Code'
import { type Machine, type Route } from '~/types'
import { cn } from '~/utils/cn'
import { getConfig, getContext } from '~/utils/config'
import { del, post, pull } from '~/utils/headscale'
import { getSession } from '~/utils/sessions'
import { useLiveData } from '~/utils/useLiveData'

import MachineRow from './machine'

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	const [machines, routes] = await Promise.all([
		pull<{ nodes: Machine[] }>('v1/node', session.get('hsApiKey')!),
		pull<{ routes: Route[] }>('v1/routes', session.get('hsApiKey')!),
	])

	const context = await getContext()
	let magic: string | undefined

	if (context.hasConfig) {
		const config = await getConfig()
		if (config.dns_config.magic_dns) {
			magic = config.dns_config.base_domain
		}
	}

	return {
		nodes: machines.nodes,
		routes: routes.routes,
		magic,
	}
}

export async function action({ request }: ActionFunctionArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	if (!session.has('hsApiKey')) {
		return json({ message: 'Unauthorized' }, {
			status: 401,
		})
	}

	const data = await request.formData()
	if (!data.has('_method') || !data.has('id')) {
		return json({ message: 'No method or ID provided' }, {
			status: 400,
		})
	}

	const id = String(data.get('id'))
	const method = String(data.get('_method'))

	switch (method) {
		case 'delete': {
			await del(`v1/node/${id}`, session.get('hsApiKey')!)
			return json({ message: 'Machine removed' })
		}

		case 'expire': {
			await post(`v1/node/${id}/expire`, session.get('hsApiKey')!)
			return json({ message: 'Machine expired' })
		}

		case 'rename': {
			if (!data.has('name')) {
				return json({ message: 'No name provided' }, {
					status: 400,
				})
			}

			const name = String(data.get('name'))

			await post(`v1/node/${id}/rename/${name}`, session.get('hsApiKey')!)
			return json({ message: 'Machine renamed' })
		}

		case 'routes': {
			if (!data.has('route') || !data.has('enabled')) {
				return json({ message: 'No route or enabled provided' }, {
					status: 400,
				})
			}

			const route = String(data.get('route'))
			const enabled = data.get('enabled') === 'true'
			const postfix = enabled ? 'enable' : 'disable'

			await post(`v1/routes/${route}/${postfix}`, session.get('hsApiKey')!)
			return json({ message: 'Route updated' })
		}

		default: {
			return json({ message: 'Invalid method' }, {
				status: 400,
			})
		}
	}
}

export default function Page() {
	useLiveData({ interval: 3000 })
	const data = useLoaderData<typeof loader>()
	const fetcher = useFetcher()

	return (
		<>
			<h1 className="text-2xl font-medium mb-4">Machines</h1>
			<table className="table-auto w-full rounded-lg">
				<thead className="text-gray-500 dark:text-gray-400">
					<tr className="text-left uppercase text-xs font-bold px-0.5">
						<th className="pb-2">Name</th>
						<th className="pb-2">
							<div className="flex items-center gap-x-1">
								Addresses
								{data.magic
									? (
										<TooltipTrigger delay={0}>
											<Button>
												<InfoIcon className="w-4 h-4" />
											</Button>
											<Tooltip className={cn(
												'text-sm max-w-xs p-2 rounded-lg mb-2',
												'bg-white dark:bg-zinc-800',
												'border border-gray-200 dark:border-zinc-700',
											)}
											>
												Since MagicDNS is enabled, you can access devices
												based on their name and also at
												{' '}
												<Code>
													[name].[user].
													{data.magic}
												</Code>
											</Tooltip>
										</TooltipTrigger>
										)
									: undefined}
							</div>
						</th>
						<th className="pb-2">Last Seen</th>
					</tr>
				</thead>
				<tbody className={cn(
					'divide-y divide-zinc-200 dark:divide-zinc-700 align-top',
					'border-t border-zinc-200 dark:border-zinc-700',
				)}
				>
					{data.nodes.map(machine => (
						<MachineRow
							key={machine.id}
							// Typescript isn't smart enough yet
							machine={machine as unknown as Machine}
							routes={data.routes.filter(route => route.node.id === machine.id) as unknown as Route[]}
							fetcher={fetcher}
							magic={data.magic}
						/>
					))}
				</tbody>
			</table>
		</>
	)
}
