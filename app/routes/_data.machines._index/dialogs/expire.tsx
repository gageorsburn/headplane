import { type FetcherWithComponents } from '@remix-run/react'
import { type Dispatch, type SetStateAction } from 'react'

import Dialog from '~/components/Dialog'
import { type Machine } from '~/types'
import { cn } from '~/utils/cn'

type DeleteProperties = {
	readonly machine: Machine;
	readonly fetcher: FetcherWithComponents<unknown>;
	readonly state: [boolean, Dispatch<SetStateAction<boolean>>];
}

export default function Expire({ machine, fetcher, state }: DeleteProperties) {
	return (
		<Dialog>
			<Dialog.Panel control={state}>
				{close => (
					<>
						<Dialog.Title>
							Expire {machine.givenName}
						</Dialog.Title>
						<Dialog.Text>
							This will disconnect the machine from your Tailnet.
							In order to reconnect, you will need to re-authenticate
							from the device.
						</Dialog.Text>
						<fetcher.Form method='POST'>
							<input type='hidden' name='_method' value='expire'/>
							<input type='hidden' name='id' value={machine.id}/>
							<div className='mt-6 flex justify-end gap-2 mt-6'>
								<Dialog.Action
									variant='cancel'
									onPress={close}
								>
									Cancel
								</Dialog.Action>
								<Dialog.Action
									variant='confirm'
									className={cn(
										'bg-red-500 hover:border-red-700',
										'dark:bg-red-600 dark:hover:border-red-700',
										'pressed:bg-red-600 hover:bg-red-600',
										'text-white dark:text-white'
									)}
									onPress={close}
								>
									Expire
								</Dialog.Action>
							</div>
						</fetcher.Form>
					</>
				)}
			</Dialog.Panel>
		</Dialog>
	)
}
